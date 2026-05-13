import type { CreateRewardRuleBody, UpdateRewardRuleBody } from '@internal/shared/reward';

import { PointTypeUseCase } from '#modules/point';

import { RewardRuleNameExistsError, RewardRuleNotFoundError, RewardRulePolicy } from '../domain';
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
    await this.deps.pointTypeUseCase.getAvailableById(ruleData.pointTypeId);

    const exists = await this.deps.rewardRuleRepo.findByName(ruleData.name);

    if (exists) {
      throw new RewardRuleNameExistsError();
    }

    const rule = await this.deps.rewardRuleRepo.create(ruleData);

    if (!rule) {
      throw new RewardRuleNotFoundError();
    }

    return rule;
  }

  async update(rewardRuleId: string, ruleData: UpdateRewardRuleBody) {
    const current = await this.get(rewardRuleId);

    if (ruleData.pointTypeId) {
      await this.deps.pointTypeUseCase.getAvailableById(ruleData.pointTypeId);
    }

    RewardRulePolicy.assertValidTimeRange({
      startsAt: ruleData.startsAt ?? current.startsAt,
      endsAt: ruleData.endsAt ?? current.endsAt,
    });

    const rule = await this.deps.rewardRuleRepo.update(rewardRuleId, ruleData);

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

  listManage() {
    return this.deps.rewardRuleRepo.listManage();
  }

  listVisible() {
    return this.deps.rewardRuleRepo.listVisible();
  }
}
