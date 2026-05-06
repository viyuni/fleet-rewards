import type { RewardRulePageQuery } from '@internal/shared';
import type { DbExecutor } from '@server/db';
import { eqIfDefined, keywordLike, PageBuilder } from '@server/db/helper';
import {
  rewardRules,
  type InsertRewardRule,
  type RewardRule,
  type UpdateRewardRule,
} from '@server/db/schema';
import { and, asc, desc, eq, gt, isNull, lte, or } from 'drizzle-orm';

export class RewardRuleRepository {
  constructor(private readonly db: DbExecutor) {}

  async findById(id: string, db: DbExecutor = this.db) {
    return await db.query.rewardRules.findFirst({
      where: {
        id,
      },
    });
  }

  async listCandidates(now = new Date(), db: DbExecutor = this.db) {
    return await db
      .select()
      .from(rewardRules)
      .where(
        and(
          eq(rewardRules.enabled, true),
          or(isNull(rewardRules.startsAt), lte(rewardRules.startsAt, now)),
          or(isNull(rewardRules.endsAt), gt(rewardRules.endsAt, now)),
        ),
      )
      .orderBy(asc(rewardRules.priority), asc(rewardRules.createdAt));
  }

  pageBuilder(query: RewardRulePageQuery) {
    return new PageBuilder(this.db, rewardRules)
      .where(
        and(
          eqIfDefined(rewardRules.enabled, query.enabled),
          eqIfDefined(rewardRules.pointTypeId, query.pointTypeId),
          eqIfDefined(rewardRules.group, query.group),
          keywordLike([rewardRules.name, rewardRules.remark], query.keyword),
        ),
      )
      .orderBy(asc(rewardRules.priority), desc(rewardRules.createdAt))
      .page(query.page)
      .pageSize(query.pageSize);
  }

  async create(input: InsertRewardRule, db: DbExecutor = this.db) {
    const [rule] = await db.insert(rewardRules).values(input).returning();
    return rule ?? null;
  }

  async update(id: string, input: UpdateRewardRule, db: DbExecutor = this.db) {
    const [rule] = await db
      .update(rewardRules)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(rewardRules.id, id))
      .returning();

    return rule ?? null;
  }

  async delete(id: string, db: DbExecutor = this.db) {
    const [rule] = await db.delete(rewardRules).where(eq(rewardRules.id, id)).returning();

    return rule ?? null;
  }

  async updateEnabled(id: string, enabled: RewardRule['enabled'], db: DbExecutor = this.db) {
    return await this.update(id, { enabled }, db);
  }
}
