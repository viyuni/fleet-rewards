import type {
  ConvertPointInput,
  CreatePointConversionRuleInput,
  UpdatePointConversionRuleInput,
} from '@internal/shared/schema';
import type { DbExecutor } from '@server/db';
import type { InsertPointConversionRule, UpdatePointConversionRule } from '@server/db/schema';

import {
  POINT_CHANGE_SOURCE_TYPE,
  PointConversionRuleInvalidError,
  PointConversionRuleNotFoundError,
  PointConversionRulePolicy,
} from '../domain';
import { PointAccountRepository, PointConversionRuleRepository } from '../repository';
import { PointBalanceUseCase } from './point-balance.usecase';
import { PointTypeUseCase } from './point-type.usecase';

export class PointConversionUseCase {
  private readonly ruleRepo: PointConversionRuleRepository;

  constructor(private readonly db: DbExecutor) {
    this.ruleRepo = new PointConversionRuleRepository(db);
  }

  list() {
    return this.ruleRepo.list();
  }

  async get(id: string) {
    const rule = await this.ruleRepo.findById(id);

    if (!rule) {
      throw new PointConversionRuleNotFoundError();
    }

    return rule;
  }

  async create(input: CreatePointConversionRuleInput) {
    PointConversionRulePolicy.assertValidShape(this.toRuleShape(input));

    await this.ensurePointTypesAvailable(input.fromPointTypeId, input.toPointTypeId);

    return this.ruleRepo.create(this.toInsertRule(input));
  }

  async update(id: string, input: UpdatePointConversionRuleInput) {
    const current = await this.get(id);
    const next = {
      ...current,
      ...this.toUpdateRule(input),
    };

    PointConversionRulePolicy.assertValidShape(next);

    if (input.fromPointTypeId || input.toPointTypeId) {
      await this.ensurePointTypesAvailable(next.fromPointTypeId, next.toPointTypeId);
    }

    return this.ruleRepo.update(id, this.toUpdateRule(input));
  }

  async enable(id: string) {
    const rule = await this.get(id);

    if (rule.enabled) {
      return rule;
    }

    return this.ruleRepo.updateEnabled(id, true);
  }

  async disable(id: string) {
    const rule = await this.get(id);

    if (!rule.enabled) {
      return rule;
    }

    return this.ruleRepo.updateEnabled(id, false);
  }

  async convert(input: ConvertPointInput) {
    return this.db.transaction(async tx => {
      const ruleRepo = new PointConversionRuleRepository(tx);
      const rule = await ruleRepo.findById(input.ruleId);

      if (!rule) {
        throw new PointConversionRuleNotFoundError();
      }

      PointConversionRulePolicy.assertAvailable(rule);

      const toAmount = PointConversionRulePolicy.calculateToAmount(rule, input.fromAmount);
      const fromAccount = await PointAccountRepository.ensureAccountAndLock(tx, {
        userId: input.userId,
        pointTypeId: rule.fromPointTypeId,
      });
      const toAccount = await PointAccountRepository.ensureAccountAndLock(tx, {
        userId: input.userId,
        pointTypeId: rule.toPointTypeId,
      });
      const sourceId = `${rule.id}:${input.requestId}`;
      const remark = input.remark ?? `积分转换：${rule.name}`;

      const consumeResult = await PointBalanceUseCase.changeBalance(tx, fromAccount, {
        type: 'consume',
        userId: input.userId,
        pointTypeId: rule.fromPointTypeId,
        delta: -input.fromAmount,
        sourceType: POINT_CHANGE_SOURCE_TYPE.Conversion,
        sourceId,
        idempotencyKey: `point:conversion:${rule.id}:${input.requestId}:consume`,
        remark,
        metadata: {
          ruleId: rule.id,
          requestId: input.requestId,
          toPointTypeId: rule.toPointTypeId,
          toAmount,
        },
      });

      const grantResult = await PointBalanceUseCase.changeBalance(tx, toAccount, {
        type: 'grant',
        userId: input.userId,
        pointTypeId: rule.toPointTypeId,
        delta: toAmount,
        sourceType: POINT_CHANGE_SOURCE_TYPE.Conversion,
        sourceId,
        idempotencyKey: `point:conversion:${rule.id}:${input.requestId}:grant`,
        remark,
        metadata: {
          ruleId: rule.id,
          requestId: input.requestId,
          fromPointTypeId: rule.fromPointTypeId,
          fromAmount: input.fromAmount,
        },
      });

      return {
        rule,
        from: consumeResult,
        to: grantResult,
      };
    });
  }

  private async ensurePointTypesAvailable(fromPointTypeId: string, toPointTypeId: string) {
    if (fromPointTypeId === toPointTypeId) {
      throw new PointConversionRuleInvalidError('来源积分类型和目标积分类型不能相同');
    }

    await PointTypeUseCase.requireAvailableById(this.db, fromPointTypeId);
    await PointTypeUseCase.requireAvailableById(this.db, toPointTypeId);
  }

  private toInsertRule(input: CreatePointConversionRuleInput): InsertPointConversionRule {
    return {
      name: input.name,
      description: input.description,
      remark: input.remark,
      fromPointTypeId: input.fromPointTypeId,
      toPointTypeId: input.toPointTypeId,
      fromAmount: input.fromAmount,
      toAmount: input.toAmount,
      minFromAmount: input.minFromAmount,
      maxFromAmount: input.maxFromAmount,
      enabled: input.enabled ?? true,
      startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
      endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
    };
  }

  private toUpdateRule(input: UpdatePointConversionRuleInput): UpdatePointConversionRule {
    return this.toRuleShape(input);
  }

  private toRuleShape(
    input: CreatePointConversionRuleInput | UpdatePointConversionRuleInput,
  ): InsertPointConversionRule | UpdatePointConversionRule {
    return {
      ...input,
      startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
      endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
    };
  }
}
