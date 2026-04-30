import type { DbExecutor } from '@server/db';
import { users } from '@server/db/schemas';
import { and, eq, isNull } from 'drizzle-orm';

export class UserRepository {
  constructor(private db: DbExecutor) {}

  async findById(userId: string) {
    const user = await this.db.query.users.findFirst({
      where: and(eq(users.id, userId), isNull(users.deletedAt)),
    });

    return user ?? null;
  }

  /**
   * 查询活动的用户
   */
  async findAvailableById(userId: string) {
    return this.db.query.users.findFirst({
      where: and(eq(users.id, userId), isNull(users.deletedAt), eq(users.status, 'normal')),
    });
  }
}
