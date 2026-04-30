import type { Db } from '@server/shared';
import { admins, BaseErrors } from '@server/shared';
import { and, eq, isNull } from 'drizzle-orm';

import type { InsertAdmin } from './model';

export class AdminRepository {
  constructor(private db: Db) {}

  async findById(id: string) {
    return this.db.query.admins.findFirst({
      where: and(eq(admins.id, id), isNull(admins.deletedAt)),
    });
  }

  async findByUsername(username: string) {
    return this.db.query.admins.findFirst({
      where: and(eq(admins.username, username), isNull(admins.deletedAt)),
    });
  }

  async findByBiliUid(biliUid: string) {
    return this.db.query.admins.findFirst({
      where: and(eq(admins.biliUid, biliUid), isNull(admins.deletedAt)),
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
      .where(and(eq(admins.id, id), isNull(admins.deletedAt)))
      .returning();

    return admin ?? null;
  }
}
