import { afterAll, describe, expect, it } from 'bun:test';

import { createDatabase, type DbTransaction } from '@server/db';
import { pointTypes } from '@server/db/schema';
import { inArray, sql } from 'drizzle-orm';
import { Pool } from 'pg';

import {
  PointTypeNameExistsError,
  PointTypeNotFoundError,
  PointTypeUnavailableError,
} from '../domain';
import { PointTypeUseCase } from '../usecase/point-type.usecase';

const testDatabaseUrl = Bun.env.TEST_DATABASE_URL;
const describeWithDatabase = testDatabaseUrl ? describe : describe.skip;
const rollback = Symbol('rollback');
const pool = testDatabaseUrl ? new Pool({ connectionString: testDatabaseUrl }) : undefined;
const db = testDatabaseUrl ? createDatabase(testDatabaseUrl) : undefined;

async function withRollback(callback: (tx: DbTransaction) => Promise<void>) {
  if (!db) {
    throw new Error('TEST_DATABASE_URL 未配置');
  }

  try {
    await db.transaction(async tx => {
      await tx.execute(sql`set local lock_timeout = '500ms'`);
      await tx.execute(sql`set local statement_timeout = '3000ms'`);
      await callback(tx as DbTransaction);
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) {
      throw error;
    }
  }
}

async function expectRejectsWith(errorPromise: Promise<unknown>, errorClass: new () => Error) {
  try {
    await errorPromise;
  } catch (error) {
    expect(error).toBeInstanceOf(errorClass);
    return;
  }

  throw new Error(`预期抛出 ${errorClass.name}`);
}

async function createPointType(
  tx: DbTransaction,
  input: {
    code?: string;
    name?: string;
    sort?: number;
    status?: 'active' | 'disabled';
    createdAt?: Date;
  } = {},
) {
  const id = crypto.randomUUID();

  const [pointType] = await tx
    .insert(pointTypes)
    .values({
      id,
      name: input.name ?? `测试积分 ${id}`,
      sort: input.sort ?? 0,
      status: input.status ?? 'active',
      createdAt: input.createdAt,
    })
    .returning();

  if (!pointType) {
    throw new Error('测试积分类型创建失败');
  }

  return pointType;
}

afterAll(async () => {
  await pool?.end();
});

describeWithDatabase('积分类型 UseCase', () => {
  it('根据 ID 获取积分类型', async () => {
    await withRollback(async tx => {
      const useCase = new PointTypeUseCase(tx);
      const pointType = await createPointType(tx);

      const result = await useCase.get(pointType.id);

      expect(result.id).toBe(pointType.id);
    });
  });

  it('获取不存在的积分类型时抛出业务错误', async () => {
    await withRollback(async tx => {
      const useCase = new PointTypeUseCase(tx);

      await expectRejectsWith(useCase.get(crypto.randomUUID()), PointTypeNotFoundError);
    });
  });

  it('可用积分类型校验通过时返回积分类型', async () => {
    await withRollback(async tx => {
      const useCase = new PointTypeUseCase(tx);
      const pointType = await createPointType(tx, { status: 'active' });

      const result = await useCase.requireAvailableById(pointType.id);

      expect(result?.id).toBe(pointType.id);
      expect(result?.status).toBe('active');
    });
  });

  it('可用积分类型校验拒绝不存在的积分类型', async () => {
    await withRollback(async tx => {
      const useCase = new PointTypeUseCase(tx);

      await expectRejectsWith(
        useCase.requireAvailableById(crypto.randomUUID()),
        PointTypeUnavailableError,
      );
    });
  });

  it('可用积分类型校验拒绝已禁用的积分类型', async () => {
    await withRollback(async tx => {
      const useCase = new PointTypeUseCase(tx);
      const pointType = await createPointType(tx, { status: 'disabled' });

      await expectRejectsWith(
        useCase.requireAvailableById(pointType.id),
        PointTypeUnavailableError,
      );
    });
  });

  it('编码不存在时可以创建积分类型', async () => {
    await withRollback(async tx => {
      const useCase = new PointTypeUseCase(tx);
      const id = crypto.randomUUID();

      const pointType = await useCase.create({
        name: `创建积分 ${id}`,
        description: '创建积分类型测试',
      });

      expect(pointType?.name).toBe(`创建积分 ${id}`);
      expect(pointType?.description).toBe('创建积分类型测试');
    });
  });

  it('Name 重复时拒绝创建积分类型', async () => {
    await withRollback(async tx => {
      const useCase = new PointTypeUseCase(tx);
      const pointType = await createPointType(tx);

      await expectRejectsWith(
        useCase.create({
          name: pointType.name,
        }),
        PointTypeNameExistsError,
      );
    });
  });

  it('存在时可以更新积分类型', async () => {
    await withRollback(async tx => {
      const useCase = new PointTypeUseCase(tx);
      const pointType = await createPointType(tx);

      const updatedPointType = await useCase.update(pointType.id, {
        name: '更新后的积分名称',
        description: '更新后的积分描述',
      });

      expect(updatedPointType?.id).toBe(pointType.id);
      expect(updatedPointType?.name).toBe('更新后的积分名称');
      expect(updatedPointType?.description).toBe('更新后的积分描述');
    });
  });

  it('更新不存在的积分类型时抛出业务错误', async () => {
    await withRollback(async tx => {
      const useCase = new PointTypeUseCase(tx);

      await expectRejectsWith(
        useCase.update(crypto.randomUUID(), {
          name: '不存在的积分类型',
        }),
        PointTypeNotFoundError,
      );
    });
  });

  it('启用不存在的积分类型时抛出业务错误', async () => {
    await withRollback(async tx => {
      const useCase = new PointTypeUseCase(tx);

      await expectRejectsWith(useCase.enable(crypto.randomUUID()), PointTypeNotFoundError);
    });
  });

  it('已启用的积分类型重复启用时直接返回原数据', async () => {
    await withRollback(async tx => {
      const useCase = new PointTypeUseCase(tx);
      const pointType = await createPointType(tx, { status: 'active' });

      const result = await useCase.enable(pointType.id);

      expect(result?.id).toBe(pointType.id);
      expect(result?.status).toBe('active');
      expect(result?.updatedAt).toEqual(pointType.updatedAt);
    });
  });

  it('停用的积分类型可以启用', async () => {
    await withRollback(async tx => {
      const useCase = new PointTypeUseCase(tx);
      const pointType = await createPointType(tx, { status: 'disabled' });

      const result = await useCase.enable(pointType.id);

      expect(result?.id).toBe(pointType.id);
      expect(result?.status).toBe('active');
    });
  });

  it('停用不存在的积分类型时抛出业务错误', async () => {
    await withRollback(async tx => {
      const useCase = new PointTypeUseCase(tx);

      await expectRejectsWith(useCase.disable(crypto.randomUUID()), PointTypeNotFoundError);
    });
  });

  it('已停用的积分类型重复停用时直接返回原数据', async () => {
    await withRollback(async tx => {
      const useCase = new PointTypeUseCase(tx);
      const pointType = await createPointType(tx, { status: 'disabled' });

      const result = await useCase.disable(pointType.id);

      expect(result?.id).toBe(pointType.id);
      expect(result?.status).toBe('disabled');
      expect(result?.updatedAt).toEqual(pointType.updatedAt);
    });
  });

  it('启用的积分类型可以停用', async () => {
    await withRollback(async tx => {
      const useCase = new PointTypeUseCase(tx);
      const pointType = await createPointType(tx, { status: 'active' });

      const result = await useCase.disable(pointType.id);
      const [persistedPointType] = await tx
        .select()
        .from(pointTypes)
        .where(inArray(pointTypes.id, [pointType.id]));

      expect(result?.id).toBe(pointType.id);
      expect(result?.status).toBe('disabled');
      expect(persistedPointType?.status).toBe('disabled');
    });
  });
});
