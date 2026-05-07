import type { DbExecutor } from '@server/db';
import { deletedAtIsNull, keywordLike, QueryPageBuilder } from '@server/db/helper';
import {
  rewardRules,
  type InsertRewardRule,
  type RewardRule,
  type UpdateRewardRule,
} from '@server/db/schema';
import { and, asc, eq, gt, isNull, lte, or } from 'drizzle-orm';

export class RewardRuleRepository {
  constructor(private readonly db: DbExecutor) {}

  async findById(id: string, db: DbExecutor = this.db) {
    return await db.query.rewardRules.findFirst({
      where: {
        id,
        deletedAt: {
          isNull: true,
        },
      },
    });
  }

  async listCandidates(now = new Date(), db: DbExecutor = this.db) {
    return await db
      .select()
      .from(rewardRules)
      .where(
        and(
          deletedAtIsNull(rewardRules),
          eq(rewardRules.enabled, true),
          or(isNull(rewardRules.startsAt), lte(rewardRules.startsAt, now)),
          or(isNull(rewardRules.endsAt), gt(rewardRules.endsAt, now)),
        ),
      )
      .orderBy(asc(rewardRules.priority), asc(rewardRules.createdAt));
  }

  async create(input: InsertRewardRule, db: DbExecutor = this.db) {
    const [rule] = await db.insert(rewardRules).values(input).returning();
    return rule ?? null;
  }

  async update(id: string, data: UpdateRewardRule, db: DbExecutor = this.db) {
    const [rule] = await db
      .update(rewardRules)
      .set(data)
      .where(and(eq(rewardRules.id, id), deletedAtIsNull(rewardRules)))
      .returning();

    return rule ?? null;
  }

  async delete(id: string, db: DbExecutor = this.db) {
    const [rule] = await db
      .update(rewardRules)
      .set({
        deletedAt: new Date(),
      })
      .where(and(eq(rewardRules.id, id), deletedAtIsNull(rewardRules)))
      .returning();

    return rule ?? null;
  }

  async updateEnabled(id: string, enabled: RewardRule['enabled'], db: DbExecutor = this.db) {
    return await this.update(id, { enabled }, db);
  }

  listManage() {
    return this.db.query.rewardRules.findMany({
      where: {
        deletedAt: {
          isNull: true,
        },
      },
      with: {
        pointType: {
          columns: {
            name: true,
          },
        },
      },
      orderBy: {
        priority: 'desc',
        createdAt: 'desc',
      },
    });
  }

  listVisible() {
    const now = new Date();

    return this.db.query.rewardRules.findMany({
      where: {
        AND: [
          {
            deletedAt: {
              isNull: true,
            },
          },
          {
            enabled: true,
          },
          {
            startsAt: {
              isNull: true,
              or: [
                {
                  lte: now,
                },
              ],
            },
            endsAt: {
              isNull: true,
              or: [
                {
                  gte: now,
                },
              ],
            },
          },
        ],
      },
      columns: {
        name: true,
        description: true,
      },
      with: {
        pointType: {
          columns: {
            name: true,
          },
        },
      },
      orderBy: {
        priority: 'desc',
        createdAt: 'desc',
      },
    });
  }
}
