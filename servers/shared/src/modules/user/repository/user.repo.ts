import type { DbExecutor } from '@server/db';
import { eqIfDefined, keywordLike, PageBuilder } from '@server/db/helper';
import { users } from '@server/db/schema';
import { and, desc, eq, getColumns } from 'drizzle-orm';

import type { UserPageFilter } from './types';

const { passwordHash: _passwordHash, ...userAdminFields } = getColumns(users);

export class UserRepository {
  constructor(private db: DbExecutor) {}

  static async findById(db: DbExecutor, id: string) {
    const user = await db.query.users.findFirst({
      where: {
        id,
        deletedAt: {
          isNull: true,
        },
      },
    });

    return user ?? null;
  }

  static async findByBiliUid(db: DbExecutor, biliUid: string) {
    const user = await db.query.users.findFirst({
      where: {
        biliUid,
        deletedAt: {
          isNull: true,
        },
      },
    });

    return user ?? null;
  }

  /**
   * 封禁用户
   */
  async ban(userId: string) {
    const [user] = await this.db
      .update(users)
      .set({
        status: 'banned',
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, userId)))
      .returning(userAdminFields);

    return user ?? null;
  }

  /**
   * 恢复用户
   */
  async restore(userId: string) {
    const [user] = await this.db
      .update(users)
      .set({
        status: 'normal',
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, userId)))
      .returning(userAdminFields);

    return user ?? null;
  }

  pageBuilder(filter: UserPageFilter) {
    return new PageBuilder(this.db, users)
      .where(
        and(
          eqIfDefined(users.status, filter.status),
          keywordLike([users.username, users.biliUid], filter.keyword),
        ),
      )
      .orderBy(desc(users.createdAt))
      .columns(userAdminFields)
      .page(filter.page)
      .pageSize(filter.pageSize);
  }
}
