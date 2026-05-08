import type { CreateRewardRuleBody, UpdateRewardRuleBody } from '@internal/shared/reward';
import type { InsertRewardRule, UpdateRewardRule } from '@server/db/schema';

import { PointTypeUseCase } from '#server/shared/modules/point';

import { RewardRuleNotFoundError, RewardRulePolicy } from '../domain';
import { RewardRuleRepository } from '../repository';

export interface RewardRuleUseCaseDeps {
  pointTypeUseCase: PointTypeUseCase;
  rewardRuleRepo: RewardRuleRepository;
}

export class RewardRuleUseCase {
  constructor(private readonly deps: RewardRuleUseCaseDeps) {}

  async get(rewardRuleId: string) {
    const rule = await this.deps.rewardRuleRepo.findById(rewardRuleId);

    if (!rule) {
      throw new RewardRuleNotFoundError();
    }

    return rule;
  }

  async create(ruleData: CreateRewardRuleBody) {
    await this.deps.pointTypeUseCase.requireAvailableById(ruleData.pointTypeId);

    const rule = await this.deps.rewardRuleRepo.create(this.toInsert(ruleData));

    if (!rule) {
      throw new RewardRuleNotFoundError();
    }

    return rule;
  }

  async update(rewardRuleId: string, ruleData: UpdateRewardRuleBody) {
    const current = await this.get(rewardRuleId);

    if (ruleData.pointTypeId) {
      await this.deps.pointTypeUseCase.requireAvailableById(ruleData.pointTypeId);
    }

    const update = this.toUpdate(ruleData);

    RewardRulePolicy.assertValidTimeRange({
      startsAt: update.startsAt ?? current.startsAt,
      endsAt: update.endsAt ?? current.endsAt,
    });

    const rule = await this.deps.rewardRuleRepo.update(rewardRuleId, update);

    if (!rule) {
      throw new RewardRuleNotFoundError();
    }

    return rule;
  }

  async enable(rewardRuleId: string) {
    const rule = await this.deps.rewardRuleRepo.updateEnabled(rewardRuleId, true);

    if (!rule) {
      throw new RewardRuleNotFoundError();
    }

    return rule;
  }

  async disable(rewardRuleId: string) {
    const rule = await this.deps.rewardRuleRepo.updateEnabled(rewardRuleId, false);

    if (!rule) {
      throw new RewardRuleNotFoundError();
    }

    return rule;
  }

  async remove(rewardRuleId: string) {
    const rule = await this.deps.rewardRuleRepo.delete(rewardRuleId);

    if (!rule) {
      throw new RewardRuleNotFoundError();
    }

    return rule;
  }

  private toInsert(input: CreateRewardRuleBody): InsertRewardRule {
    const rule: InsertRewardRule = {
      ...input,
      startsAt: this.parseDate(input.startsAt),
      endsAt: this.parseDate(input.endsAt),
    };

    RewardRulePolicy.assertValidTimeRange(rule);

    return rule;
  }

  private toUpdate(input: UpdateRewardRuleBody): UpdateRewardRule {
    return {
      ...input,
      startsAt: this.parseDate(input.startsAt),
      endsAt: this.parseDate(input.endsAt),
    };
  }

  private parseDate(value: number | undefined) {
    return value === undefined ? undefined : new Date(value);
  }

  listManage() {
    return this.deps.rewardRuleRepo.listManage();
  }

  listVisible() {
    return this.deps.rewardRuleRepo.listVisible();
  }
}
