import type { AdminPageQuery, AdminUpdateBody } from '@internal/shared';
import type { DbExecutor } from '@server/db';
import { QueryPageBuilder } from '@server/db/helper';
import { admins, type InsertAdmin } from '@server/db/schema';
import { BadRequestError, BaseErrors } from '@server/shared';
import { and, eq } from 'drizzle-orm';

export class AdminRepository {
  constructor(private db: DbExecutor) {}

  async findActiveById(adminId: string) {
    return await this.db.query.admins.findFirst({
      where: {
        id: adminId,
        status: 'active',
      },
    });
  }

  async findById(adminId: string) {
    return this.db.query.admins.findFirst({
      where: {
        id: adminId,
      },
    });
  }

  async findActiveInfoById(adminId: string) {
    return await this.db.query.admins.findFirst({
      where: {
        id: adminId,
        status: 'active',
      },
      columns: {
        id: true,
        uid: true,
        username: true,
        role: true,
        lastLoginAt: true,
      },
    });
  }

  async findByUid(uid: string) {
    return await this.db.query.admins.findFirst({
      where: {
        uid,
      },
    });
  }

  async findByUsername(username: string) {
    return await this.db.query.admins.findFirst({
      where: {
        username,
      },
    });
  }

  async findActiveByUid(uid: string) {
    return await this.db.query.admins.findFirst({
      where: {
        uid,
        status: 'active',
      },
    });
  }

  async create(input: InsertAdmin) {
    const [admin] = await this.db.insert(admins).values(input).returning();

    if (!admin) {
      throw new BaseErrors.BadRequestError('管理员创建失败');
    }

    return admin;
  }

  async updateLastLoginAt(id: string, lastLoginAt = new Date()) {
    const [admin] = await this.db
      .update(admins)
      .set({ lastLoginAt })
      .where(and(eq(admins.id, id)))
      .returning();

    return admin;
  }

  async update(id: string, input: AdminUpdateBody) {
    const [admin] = await this.db
      .update(admins)
      .set(input)
      .where(and(eq(admins.id, id), eq(admins.status, 'active')))
      .returning({
        id: admins.id,
        uid: admins.uid,
        username: admins.username,
        status: admins.status,
        role: admins.role,
        remark: admins.remark,
        createdAt: admins.createdAt,
        updatedAt: admins.updatedAt,
      });

    return admin;
  }

  async updatePassword(id: string, passwordHash: string) {
    const [admin] = await this.db
      .update(admins)
      .set({ passwordHash })
      .where(and(eq(admins.id, id), eq(admins.status, 'active')))
      .returning({
        id: admins.id,
        uid: admins.uid,
        username: admins.username,
      });

    if (!admin) {
      throw new BadRequestError('密码更新失败');
    }
  }

  async ban(id: string) {
    const [admin] = await this.db
      .update(admins)
      .set({ status: 'disabled' })
      .where(and(eq(admins.id, id), eq(admins.role, 'admin'), eq(admins.status, 'active')))
      .returning({
        id: admins.id,
        status: admins.status,
        role: admins.role,
      });

    return admin;
  }

  async restore(id: string) {
    const [admin] = await this.db
      .update(admins)
      .set({ status: 'active' })
      .where(and(eq(admins.id, id), eq(admins.role, 'admin'), eq(admins.status, 'disabled')))
      .returning({
        id: admins.id,
        status: admins.status,
        role: admins.role,
      });

    return admin;
  }

  page(query: AdminPageQuery) {
    return new QueryPageBuilder(this.db, admins, this.db.query.admins)
      .query((findMany, { limit, offset }) =>
        findMany({
          limit,
          offset,
          columns: {
            id: true,
            uid: true,
            username: true,
            status: true,
            role: true,
            lastLoginAt: true,
            remark: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
      )
      .page(query.page)
      .pageSize(query.pageSize)
      .paginate();
  }
}
