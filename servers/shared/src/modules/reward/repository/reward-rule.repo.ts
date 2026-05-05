import type { DbExecutor } from '@server/db';
import { eqIfDefined, keywordLike, PageBuilder } from '@server/db/helper';
import {
  rewardRules,
  type InsertRewardRule,
  type RewardRule,
  type UpdateRewardRule,
} from '@server/db/schema';
import { and, asc, desc, eq, gt, isNull, lte, or } from 'drizzle-orm';

export interface RewardRulePageFilter {
  page?: number;
  pageSize?: number;
  enabled?: boolean;
  pointTypeId?: string;
  group?: string;
  keyword?: string;
}

export class RewardRuleRepository {
  constructor(private readonly db: DbExecutor) {}

  static async findById(db: DbExecutor, id: string) {
    return await db.query.rewardRules.findFirst({
      where: {
        id,
      },
    });
  }

  async listCandidates(now = new Date()) {
    return await this.db
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

  pageBuilder(filter: RewardRulePageFilter) {
    return new PageBuilder(this.db, rewardRules)
      .where(
        and(
          eqIfDefined(rewardRules.enabled, filter.enabled),
          eqIfDefined(rewardRules.pointTypeId, filter.pointTypeId),
          eqIfDefined(rewardRules.group, filter.group),
          keywordLike([rewardRules.name, rewardRules.remark], filter.keyword),
        ),
      )
      .orderBy(asc(rewardRules.priority), desc(rewardRules.createdAt))
      .page(filter.page)
      .pageSize(filter.pageSize);
  }

  async findById(id: string) {
    return await RewardRuleRepository.findById(this.db, id);
  }

  async create(input: InsertRewardRule) {
    const [rule] = await this.db.insert(rewardRules).values(input).returning();
    return rule ?? null;
  }

  async update(id: string, input: UpdateRewardRule) {
    const [rule] = await this.db
      .update(rewardRules)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(rewardRules.id, id))
      .returning();

    return rule ?? null;
  }

  async delete(id: string) {
    const [rule] = await this.db.delete(rewardRules).where(eq(rewardRules.id, id)).returning();

    return rule ?? null;
  }

  async updateEnabled(id: string, enabled: RewardRule['enabled']) {
    return await this.update(id, { enabled });
  }
}
