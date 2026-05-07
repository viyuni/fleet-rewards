import { afterEach, beforeEach, describe, expect, it } from 'bun:test';

import { createDatabase, type DbClient } from '@server/db';
import { admins } from '@server/db/schema';
import { eq, inArray, like } from 'drizzle-orm';

import { AdminNotFoundError, AdminSuperAdminCannotBeBannedError } from '../domain/errors';
import { AdminRepository } from '../repository';
import { AdminUseCase } from '../usecase';

const testDatabaseUrl = Bun.env.TEST_DATABASE_URL ?? Bun.env.DATABASE_URL;
const describeWithDatabase = testDatabaseUrl ? describe : describe.skip;

let db: DbClient;
const batches = new Set<string>();
const originalDefaultAdmin = AdminUseCase.DEFAULT_ADMIN;

function newBatch() {
  const batch = `admin_test_${crypto.randomUUID().slice(0, 8)}`;
  batches.add(batch);
  return batch;
}

function createUseCase() {
  return new AdminUseCase({
    adminRepo: new AdminRepository(db),
  });
}

async function seedAdmin(input: {
  uid: string;
  username: string;
  role?: 'admin' | 'superAdmin';
  status?: 'active' | 'disabled';
}) {
  const [admin] = await db
    .insert(admins)
    .values({
      uid: input.uid,
      username: input.username,
      role: input.role ?? 'admin',
      status: input.status ?? 'active',
      passwordHash: await Bun.password.hash('password123', {
        algorithm: 'bcrypt',
        cost: 4,
      }),
    })
    .returning();

  if (!admin) throw new Error('seed admin failed');
  return admin;
}

async function findSuperAdmin() {
  return (
    (await db.query.admins.findFirst({
      where: {
        role: 'superAdmin',
      },
    })) ?? null
  );
}

async function cleanupBatch(batch: string) {
  const rows = await db
    .select({ id: admins.id })
    .from(admins)
    .where(like(admins.username, `${batch}%`));
  const ids = rows.map(row => row.id);

  if (ids.length > 0) {
    await db.delete(admins).where(inArray(admins.id, ids));
  }
}

beforeEach(() => {
  if (!testDatabaseUrl) return;
  db = createDatabase(testDatabaseUrl);
});

afterEach(async () => {
  AdminUseCase.DEFAULT_ADMIN = originalDefaultAdmin;

  if (!db) return;

  try {
    for (const batch of batches) {
      await cleanupBatch(batch);
    }
  } finally {
    batches.clear();
    await db.$client.end();
  }
});

describeWithDatabase('AdminUseCase 真实数据库', () => {
  it('创建管理员时只能创建普通管理员', async () => {
    const batch = newBatch();
    const useCase = createUseCase();

    const created = await useCase.create({
      uid: `${Date.now()}01` as unknown as `${number}`,
      username: `${batch}_normal`,
      password: 'password123',
      remark: 'normal',
    });
    const row = await db.query.admins.findFirst({
      where: {
        id: created.id,
      },
    });

    expect(row?.role).toBe('admin');
    expect(row?.status).toBe('active');
  });

  it('超级管理员可以更新管理员 username 和 remark', async () => {
    const batch = newBatch();
    const useCase = createUseCase();
    const seeded = await seedAdmin({
      uid: `${Date.now()}06`,
      username: `${batch}_update`,
      role: 'admin',
    });

    const updated = await useCase.update(seeded.id, {
      username: `${batch}_updated`,
      remark: 'updated remark',
    });

    expect(updated).toMatchObject({
      id: seeded.id,
      username: `${batch}_updated`,
      remark: 'updated remark',
    });
  });

  it('管理员可以更新自己的 username 和 remark', async () => {
    const batch = newBatch();
    const useCase = createUseCase();
    const seeded = await seedAdmin({
      uid: `${Date.now()}07`,
      username: `${batch}_self`,
      role: 'admin',
    });

    const updated = await useCase.updateMe(seeded.id, {
      username: `${batch}_self_updated`,
      remark: 'self updated remark',
    });

    expect(updated).toMatchObject({
      id: seeded.id,
      username: `${batch}_self_updated`,
      remark: 'self updated remark',
    });
  });

  it('更新管理员为重复 username 时会抛出错误', async () => {
    const batch = newBatch();
    const useCase = createUseCase();
    const existing = await seedAdmin({
      uid: `${Date.now()}08`,
      username: `${batch}_existing`,
    });
    const target = await seedAdmin({
      uid: `${Date.now()}09`,
      username: `${batch}_target`,
    });

    await expect(
      useCase.update(target.id, {
        username: existing.username,
      }),
    ).rejects.toThrow('管理员用户名已存在');
  });

  it('初始化默认管理员时创建唯一超级管理员', async () => {
    if (await findSuperAdmin()) {
      return;
    }

    const batch = newBatch();
    const useCase = createUseCase();

    AdminUseCase.DEFAULT_ADMIN = {
      uid: `${Date.now()}02` as unknown as `${number}`,
      username: `${batch}_default`,
    };

    await useCase.initDefaultAdmin();

    const row = await db.query.admins.findFirst({
      where: {
        username: `${batch}_default`,
      },
    });

    expect(row?.role).toBe('superAdmin');
    expect(row?.status).toBe('active');
  });

  it('默认管理员已存在时不会重复创建超级管理员', async () => {
    const batch = newBatch();
    const useCase = createUseCase();
    const existingSuperAdmin = await findSuperAdmin();
    const defaultAdmin = {
      uid: (existingSuperAdmin?.uid ?? `${Date.now()}03`) as unknown as `${number}`,
      username: existingSuperAdmin?.username ?? `${batch}_existing_default`,
    };

    AdminUseCase.DEFAULT_ADMIN = defaultAdmin;
    if (!existingSuperAdmin) {
      await seedAdmin({
        ...defaultAdmin,
        role: 'superAdmin',
      });
    }

    await useCase.initDefaultAdmin();

    const rows = await db
      .select({ id: admins.id })
      .from(admins)
      .where(eq(admins.uid, defaultAdmin.uid));

    expect(rows.length).toBe(1);
  });

  it('可以封禁普通管理员', async () => {
    const batch = newBatch();
    const useCase = createUseCase();
    const seeded = await seedAdmin({
      uid: `${Date.now()}04`,
      username: `${batch}_ban`,
      role: 'admin',
    });

    const result = await useCase.ban(seeded.id);
    const row = await db.query.admins.findFirst({
      where: {
        id: seeded.id,
      },
    });

    expect(result).toEqual({
      id: seeded.id,
      status: 'disabled',
      role: 'admin',
    });
    expect(row?.status).toBe('disabled');
  });

  it('不能封禁超级管理员', async () => {
    const batch = newBatch();
    const useCase = createUseCase();
    const seeded =
      (await findSuperAdmin()) ??
      (await seedAdmin({
        uid: `${Date.now()}05`,
        username: `${batch}_super`,
        role: 'superAdmin',
      }));

    await expect(useCase.ban(seeded.id)).rejects.toThrow(AdminSuperAdminCannotBeBannedError);
  });

  it('封禁不存在的管理员会抛出错误', async () => {
    const useCase = createUseCase();

    await expect(useCase.ban(crypto.randomUUID())).rejects.toThrow(AdminNotFoundError);
  });
});
