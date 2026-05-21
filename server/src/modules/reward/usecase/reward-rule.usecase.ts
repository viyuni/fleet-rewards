import type { CreateRewardRuleBody, UpdateRewardRuleBody } from '@internal/shared/reward';

import { parseDate } from '#db/helper';
import type { InsertRewardRule, UpdateRewardRule } from '#db/schema';
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

    const { endTime, startTime, ...data } = ruleData;
    const createData: InsertRewardRule = {
      ...data,
      endTime: parseDate(endTime),
      startTime: parseDate(startTime),
    };

    const rule = await this.deps.rewardRuleRepo.create(createData);

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

    const startTime = ruleData.startTime === undefined ? undefined : parseDate(ruleData.startTime);
    const endTime = ruleData.endTime === undefined ? undefined : parseDate(ruleData.endTime);

    RewardRulePolicy.assertValidTimeRange({
      startTime: startTime === undefined ? current.startTime : startTime,
      endTime: endTime === undefined ? current.endTime : endTime,
    });

    const { endTime: _endTime, startTime: _startTime, ...data } = ruleData;
    const updateData: UpdateRewardRule = {
      ...data,
      endTime,
      startTime,
    };

    const rule = await this.deps.rewardRuleRepo.update(rewardRuleId, updateData);

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
