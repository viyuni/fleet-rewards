import type { DbExecutor } from '@server/db';
import { users } from '@server/db/schema';
import { BaseErrors } from '@server/shared/errors';

export type User = typeof users.$inferSelect;

export type CreateUserInput = {
  biliUid: string;
  username: string;
  passwordHash: string;
};

export class UserRepository {
  constructor(private db: DbExecutor) {}

  async findById(id: string) {
    return this.db.query.users.findFirst({
      where: {
        id,
      },
    });
  }

  async findByUsername(username: string) {
    return this.db.query.users.findFirst({
      where: {
        username,
      },
    });
  }

  async findByBiliUid(biliUid: string) {
    return this.db.query.users.findFirst({
      where: {
        biliUid,
      },
    });
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
