import type { CreateRewardRuleBody, UpdateRewardRuleBody } from '@internal/shared';
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

  async get(id: string) {
    const rule = await this.deps.rewardRuleRepo.findById(id);

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

  async update(id: string, ruleData: UpdateRewardRuleBody) {
    const current = await this.get(id);

    if (ruleData.pointTypeId) {
      await this.deps.pointTypeUseCase.requireAvailableById(ruleData.pointTypeId);
    }

    const update = this.toUpdate(ruleData);

    RewardRulePolicy.assertValidTimeRange({
      startsAt: update.startsAt ?? current.startsAt,
      endsAt: update.endsAt ?? current.endsAt,
    });

    const rule = await this.deps.rewardRuleRepo.update(id, update);

    if (!rule) {
      throw new RewardRuleNotFoundError();
    }

    return rule;
  }

  async enable(id: string) {
    const rule = await this.deps.rewardRuleRepo.updateEnabled(id, true);

    if (!rule) {
      throw new RewardRuleNotFoundError();
    }

    return rule;
  }

  async disable(id: string) {
    const rule = await this.deps.rewardRuleRepo.updateEnabled(id, false);

    if (!rule) {
      throw new RewardRuleNotFoundError();
    }

    return rule;
  }

  async remove(id: string) {
    const rule = await this.deps.rewardRuleRepo.delete(id);

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
