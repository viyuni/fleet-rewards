import type {
  CreateRewardRuleInput,
  RewardRulePageQuery,
  UpdateRewardRuleInput,
} from '@internal/shared';
import type { DbExecutor } from '@server/db';
import type { InsertRewardRule, UpdateRewardRule } from '@server/db/schema';

import { PointTypePolicy, PointTypeRepository } from '#server/shared/modules/point';

import { RewardRuleNotFoundError, RewardRulePolicy } from '../domain';
import { RewardRuleRepository } from '../repository';

export class RewardRuleUseCase {
  private readonly rewardRuleRepo: RewardRuleRepository;

  constructor(private readonly db: DbExecutor) {
    this.rewardRuleRepo = new RewardRuleRepository(db);
  }

  page(filter: RewardRulePageQuery = {}) {
    return this.rewardRuleRepo.pageBuilder(filter).paginate();
  }

  async get(id: string) {
    const rule = await this.rewardRuleRepo.findById(id);

    if (!rule) {
      throw new RewardRuleNotFoundError();
    }

    return rule;
  }

  async create(input: CreateRewardRuleInput) {
    await this.assertPointTypeAvailable(input.pointTypeId);

    const rule = await this.rewardRuleRepo.create(this.toInsert(input));

    if (!rule) {
      throw new RewardRuleNotFoundError();
    }

    return rule;
  }

  async update(id: string, input: UpdateRewardRuleInput) {
    const current = await this.get(id);

    if (input.pointTypeId) {
      await this.assertPointTypeAvailable(input.pointTypeId);
    }

    const update = this.toUpdate(input);

    RewardRulePolicy.assertValidTimeRange({
      startsAt: update.startsAt ?? current.startsAt,
      endsAt: update.endsAt ?? current.endsAt,
    });

    const rule = await this.rewardRuleRepo.update(id, update);

    if (!rule) {
      throw new RewardRuleNotFoundError();
    }

    return rule;
  }

  async enable(id: string) {
    const rule = await this.rewardRuleRepo.updateEnabled(id, true);

    if (!rule) {
      throw new RewardRuleNotFoundError();
    }

    return rule;
  }

  async disable(id: string) {
    const rule = await this.rewardRuleRepo.updateEnabled(id, false);

    if (!rule) {
      throw new RewardRuleNotFoundError();
    }

    return rule;
  }

  async remove(id: string) {
    const rule = await this.rewardRuleRepo.delete(id);

    if (!rule) {
      throw new RewardRuleNotFoundError();
    }

    return rule;
  }

  private async assertPointTypeAvailable(pointTypeId: string) {
    const pointType = await PointTypeRepository.findById(this.db, pointTypeId);

    PointTypePolicy.assertAvailable(pointType);
  }

  private toInsert(input: CreateRewardRuleInput): InsertRewardRule {
    const rule: InsertRewardRule = {
      ...input,
      startsAt: this.parseDate(input.startsAt),
      endsAt: this.parseDate(input.endsAt),
    };

    RewardRulePolicy.assertValidTimeRange(rule);

    return rule;
  }

  private toUpdate(input: UpdateRewardRuleInput): UpdateRewardRule {
    return {
      ...input,
      startsAt: this.parseDate(input.startsAt),
      endsAt: this.parseDate(input.endsAt),
    };
  }

  private parseDate(value: number | undefined) {
    return value === undefined ? undefined : new Date(value);
  }
}
