import type {
  ConvertPointBody,
  CreatePointConversionRuleBody,
  UpdatePointConversionRuleBody,
} from '@internal/shared/schema';
import type { DbClient } from '@server/db';
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

export interface PointConversionUseCaseDeps {
  db: DbClient;
  pointAccountRepo: PointAccountRepository;
  pointBalanceUseCase: PointBalanceUseCase;
  pointConversionRuleRepo: PointConversionRuleRepository;
  pointTypeUseCase: PointTypeUseCase;
}

export class PointConversionUseCase {
  constructor(private readonly deps: PointConversionUseCaseDeps) {}

  list() {
    return this.deps.pointConversionRuleRepo.list();
  }

  async get(id: string) {
    const rule = await this.deps.pointConversionRuleRepo.findById(id);

    if (!rule) {
      throw new PointConversionRuleNotFoundError();
    }

    return rule;
  }

  async create(ruleData: CreatePointConversionRuleBody) {
    PointConversionRulePolicy.assertValidShape(this.toRuleShape(ruleData));

    await this.ensurePointTypesAvailable(ruleData.fromPointTypeId, ruleData.toPointTypeId);

    return this.deps.pointConversionRuleRepo.create(this.toInsertRule(ruleData));
  }

  async update(id: string, ruleData: UpdatePointConversionRuleBody) {
    const current = await this.get(id);
    const next = {
      ...current,
      ...this.toUpdateRule(ruleData),
    };

    PointConversionRulePolicy.assertValidShape(next);

    if (ruleData.fromPointTypeId || ruleData.toPointTypeId) {
      await this.ensurePointTypesAvailable(next.fromPointTypeId, next.toPointTypeId);
    }

    return this.deps.pointConversionRuleRepo.update(id, this.toUpdateRule(ruleData));
  }

  async enable(id: string) {
    const rule = await this.get(id);

    if (rule.enabled) {
      return rule;
    }

    return this.deps.pointConversionRuleRepo.updateEnabled(id, true);
  }

  async disable(id: string) {
    const rule = await this.get(id);

    if (!rule.enabled) {
      return rule;
    }

    return this.deps.pointConversionRuleRepo.updateEnabled(id, false);
  }

  async convert(conversionData: ConvertPointBody) {
    const rule = await this.deps.pointConversionRuleRepo.findById(conversionData.ruleId);

    if (!rule) {
      throw new PointConversionRuleNotFoundError();
    }

    PointConversionRulePolicy.assertAvailable(rule);

    const toAmount = PointConversionRulePolicy.calculateToAmount(rule, conversionData.fromAmount);

    return this.deps.db.transaction(async tx => {
      const fromAccount = await this.deps.pointAccountRepo.ensureAccountAndLock(tx, {
        userId: conversionData.userId,
        pointTypeId: rule.fromPointTypeId,
      });
      const toAccount = await this.deps.pointAccountRepo.ensureAccountAndLock(tx, {
        userId: conversionData.userId,
        pointTypeId: rule.toPointTypeId,
      });
      const sourceId = `${rule.id}:${conversionData.nonce}`;
      const remark = conversionData.remark ?? `积分转换：${rule.name}`;

      const consumeResult = await this.deps.pointBalanceUseCase.changeBalance(tx, fromAccount, {
        type: 'consume',
        userId: conversionData.userId,
        pointTypeId: rule.fromPointTypeId,
        delta: -conversionData.fromAmount,
        sourceType: POINT_CHANGE_SOURCE_TYPE.Conversion,
        sourceId,
        idempotencyKey: `point:conversion:${rule.id}:${conversionData.nonce}:consume`,
        remark,
        metadata: {
          ruleId: rule.id,
          nonce: conversionData.nonce,
          toPointTypeId: rule.toPointTypeId,
          toAmount,
        },
      });

      const grantResult = await this.deps.pointBalanceUseCase.changeBalance(tx, toAccount, {
        type: 'grant',
        userId: conversionData.userId,
        pointTypeId: rule.toPointTypeId,
        delta: toAmount,
        sourceType: POINT_CHANGE_SOURCE_TYPE.Conversion,
        sourceId,
        idempotencyKey: `point:conversion:${rule.id}:${conversionData.nonce}:grant`,
        remark,
        metadata: {
          ruleId: rule.id,
          nonce: conversionData.nonce,
          fromPointTypeId: rule.fromPointTypeId,
          fromAmount: conversionData.fromAmount,
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

    await this.deps.pointTypeUseCase.requireAvailableById(fromPointTypeId);
    await this.deps.pointTypeUseCase.requireAvailableById(toPointTypeId);
  }

  private toInsertRule(ruleData: CreatePointConversionRuleBody): InsertPointConversionRule {
    return {
      name: ruleData.name,
      description: ruleData.description,
      remark: ruleData.remark,
      fromPointTypeId: ruleData.fromPointTypeId,
      toPointTypeId: ruleData.toPointTypeId,
      fromAmount: ruleData.fromAmount,
      toAmount: ruleData.toAmount,
      minFromAmount: ruleData.minFromAmount,
      maxFromAmount: ruleData.maxFromAmount,
      enabled: ruleData.enabled ?? true,
      startsAt: ruleData.startsAt ? new Date(ruleData.startsAt) : undefined,
      endsAt: ruleData.endsAt ? new Date(ruleData.endsAt) : undefined,
    };
  }

  private toUpdateRule(ruleData: UpdatePointConversionRuleBody): UpdatePointConversionRule {
    return this.toRuleShape(ruleData);
  }

  private toRuleShape(
    ruleData: CreatePointConversionRuleBody | UpdatePointConversionRuleBody,
  ): InsertPointConversionRule | UpdatePointConversionRule {
    return {
      ...ruleData,
      startsAt: ruleData.startsAt ? new Date(ruleData.startsAt) : undefined,
      endsAt: ruleData.endsAt ? new Date(ruleData.endsAt) : undefined,
    };
  }
}
