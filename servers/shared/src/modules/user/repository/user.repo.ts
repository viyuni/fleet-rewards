import type { UserPageQuery } from '@internal/shared';
import type { DbExecutor } from '@server/db';
import { eqIfDefined, keywordLike, PageBuilder } from '@server/db/helper';
import { users } from '@server/db/schema';
import { and, desc, eq } from 'drizzle-orm';

export class UserRepository {
  constructor(private db: DbExecutor) {}

  /**
   * 获取用户
   */
  async findById(userId: string, db: DbExecutor = this.db) {
    const user = await db.query.users.findFirst({
      where: {
        id: userId,
      },
    });

    return user ?? null;
  }

  /**
   * 通过 B站 UID 查询用户
   */
  async findByBiliUid(biliUid: string, db: DbExecutor = this.db) {
    const user = await db.query.users.findFirst({
      where: {
        biliUid,
      },
    });

    return user ?? null;
  }

  /**
   * 查询用户详情
   */
  async findDetailById(userId: string) {
    const user = await this.db.query.users.findFirst({
      columns: {
        id: true,
        biliUid: true,
        username: true,
        status: true,
        phoneEncrypted: true,
        emailEncrypted: true,
        addressEncrypted: true,
      },
      with: {
        pointAccounts: {
          columns: {
            id: true,
            balance: true,
            status: true,
          },
          with: {
            pointType: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      where: {
        id: userId,
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
      .returning();

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
      .returning();

    return user ?? null;
  }

  /**
   * 分页构造查询
   */
  pageBuilder(query: UserPageQuery) {
    return new PageBuilder(this.db, users)
      .where(
        and(
          eqIfDefined(users.status, query.status),
          keywordLike([users.username, users.biliUid], query.keyword),
        ),
      )
      .orderBy(desc(users.createdAt))
      .page(query.page)
      .pageSize(query.pageSize);
  }

  /**
   * 分页
   */
  page(query: UserPageQuery) {
    return this.pageBuilder(query).paginate();
  }
}
