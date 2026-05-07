import type { DbExecutor } from '@server/db';
import { admins, type InsertAdmin } from '@server/db/schema';
import { BaseErrors } from '@server/shared';
import { and, eq } from 'drizzle-orm';

export class AdminRepository {
  constructor(private db: DbExecutor) {}

  async findById(adminId: string) {
    const admin = await this.db.query.admins.findFirst({
      where: {
        id: adminId,
        status: 'active',
      },
    });

    return admin;
  }

  async findInfoById(adminId: string) {
    const admin = await this.db.query.admins.findFirst({
      where: {
        id: adminId,
        status: 'active',
      },
      columns: {
        id: true,
        uid: true,
        username: true,
        lastLoginAt: true,
      },
    });

    return admin ?? null;
  }

  async findByBiliUid(uid: string) {
    return await this.db.query.admins.findFirst({
      where: {
        uid,
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

    return admin ?? null;
  }
}
