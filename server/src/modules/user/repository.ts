import { and, eq, isNull } from 'drizzle-orm';

import type { Db } from '#server/db';
import { users } from '#server/db/schema';
import { BaseErrors } from '#server/shared/errors';

export type User = typeof users.$inferSelect;

export type CreateUserInput = {
  biliUid: string;
  username: string;
  passwordHash: string;
};

export class UserRepository {
  constructor(private db: Db) {}

  async findById(id: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1);

    return user ?? null;
  }

  async findByUsername(username: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.username, username), isNull(users.deletedAt)))
      .limit(1);

    return user ?? null;
  }

  async findByBiliUid(biliUid: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.biliUid, biliUid), isNull(users.deletedAt)))
      .limit(1);

    return user ?? null;
  }

  async create(input: CreateUserInput) {
    const [user] = await this.db
      .insert(users)
      .values({
        biliUid: input.biliUid,
        username: input.username,
        passwordHash: input.passwordHash,
      })
      .returning();

    if (!user) {
      throw new BaseErrors.BadRequestError('用户创建失败');
    }

    return user;
  }
}
