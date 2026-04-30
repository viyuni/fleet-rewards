import type { DbExecutor } from '@server/db';
import { admins, type InsertAdmin } from '@server/db/schemas';
import { BaseErrors } from '@server/shared';
import { and, eq, isNull } from 'drizzle-orm';

export class AdminRepository {
  constructor(private db: DbExecutor) {}

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
