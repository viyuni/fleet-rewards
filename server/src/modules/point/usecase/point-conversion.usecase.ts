import type {
  ConvertPointBody,
  CreatePointConversionRuleBody,
  UpdatePointConversionRuleBody,
} from '@internal/shared/point-conversion';

import type { DbClient } from '#db';
import { parseDate } from '#db/helper';
import type { InsertPointConversionRule, UpdatePointConversionRule } from '#db/schema';

import {
  POINT_CHANGE_SOURCE_TYPE,
  PointIdempotencyKey,
  PointConversionRuleInvalidError,
  PointConversionRuleNameExistsError,
  PointConversionRuleNotFoundError,
  PointConversionRulePairExistsError,
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

  async get(pointConversionRuleId: string) {
    const rule = await this.deps.pointConversionRuleRepo.findById(pointConversionRuleId);

    if (!rule) {
      throw new PointConversionRuleNotFoundError();
    }

    return rule;
  }

  async create(ruleData: CreatePointConversionRuleBody) {
    const startTime = parseDate(ruleData.startTime);
    const endTime = parseDate(ruleData.endTime);

    PointConversionRulePolicy.assertValidShape({
      ...ruleData,
      endTime,
      startTime,
    });

    const exists = await this.deps.pointConversionRuleRepo.findByName(ruleData.name);

    if (exists) {
      throw new PointConversionRuleNameExistsError();
    }

    await this.assertPointTypesAvailable(ruleData.fromPointTypeId, ruleData.toPointTypeId);
    await this.assertRulePairAvailable(ruleData.fromPointTypeId, ruleData.toPointTypeId);

    const { endTime: _endTime, startTime: _startTime, ...data } = ruleData;
    const createData: InsertPointConversionRule = {
      ...data,
      endTime,
      startTime,
    };

    return this.deps.pointConversionRuleRepo.create(createData);
  }

  async update(pointConversionRuleId: string, ruleData: UpdatePointConversionRuleBody) {
    const current = await this.get(pointConversionRuleId);
    const startTime = ruleData.startTime === undefined ? undefined : parseDate(ruleData.startTime);
    const endTime = ruleData.endTime === undefined ? undefined : parseDate(ruleData.endTime);
    const next = {
      ...current,
      ...ruleData,
      endTime: endTime === undefined ? current.endTime : endTime,
      startTime: startTime === undefined ? current.startTime : startTime,
    };

    PointConversionRulePolicy.assertValidShape(next);

    if (ruleData.fromPointTypeId || ruleData.toPointTypeId) {
      await this.assertPointTypesAvailable(next.fromPointTypeId, next.toPointTypeId);
    }

    const { endTime: _endTime, startTime: _startTime, ...data } = ruleData;
    const updateData: UpdatePointConversionRule = {
      ...data,
      endTime,
      startTime,
    };

    return this.deps.pointConversionRuleRepo.update(pointConversionRuleId, updateData);
  }

  async enable(pointConversionRuleId: string) {
    const rule = await this.get(pointConversionRuleId);

    if (rule.enabled) {
      return rule;
    }

    return this.deps.pointConversionRuleRepo.enabled(pointConversionRuleId);
  }

  async disable(pointConversionRuleId: string) {
    const rule = await this.get(pointConversionRuleId);

    if (!rule.enabled) {
      return rule;
    }

    return this.deps.pointConversionRuleRepo.disabled(pointConversionRuleId);
  }

  async convert(conversionData: ConvertPointBody) {
    const rule = await this.deps.pointConversionRuleRepo.findById(conversionData.ruleId);

    if (!rule) {
      throw new PointConversionRuleNotFoundError();
    }

    PointConversionRulePolicy.assertAvailable(rule);

    const toAmount = PointConversionRulePolicy.calculateToAmount(rule, conversionData.fromAmount);

    return this.deps.db.transaction(async tx => {
      // 获取扣除的积分账户并行锁
      const fromAccount = await this.deps.pointAccountRepo.ensureAccountAndLock(tx, {
        userId: conversionData.userId,
        pointTypeId: rule.fromPointTypeId,
      });

      // 获取添加的积分账户并行锁
      const toAccount = await this.deps.pointAccountRepo.ensureAccountAndLock(tx, {
        userId: conversionData.userId,
        pointTypeId: rule.toPointTypeId,
      });

      const sourceId = `convert:${rule.id}:${conversionData.nonce}`;
      const remark = conversionData.remark ?? `积分转换：${rule.name}`;

      // 扣除积分
      const consumeResult = await this.deps.pointBalanceUseCase.changeBalance(tx, fromAccount, {
        type: 'consume',
        userId: conversionData.userId,
        pointTypeId: rule.fromPointTypeId,
        delta: -conversionData.fromAmount,
        sourceType: POINT_CHANGE_SOURCE_TYPE.Conversion,
        sourceId,
        idempotencyKey: PointIdempotencyKey.conversionConsume({
          ruleId: rule.id,
          nonce: conversionData.nonce,
        }),
        remark,
        metadata: {
          ruleId: rule.id,
          nonce: conversionData.nonce,
          toPointTypeId: rule.toPointTypeId,
          toAmount,
        },
      });

      // 添加积分
      const grantResult = await this.deps.pointBalanceUseCase.changeBalance(tx, toAccount, {
        type: 'grant',
        userId: conversionData.userId,
        pointTypeId: rule.toPointTypeId,
        delta: toAmount,
        sourceType: POINT_CHANGE_SOURCE_TYPE.Conversion,
        sourceId,
        idempotencyKey: PointIdempotencyKey.conversionGrant({
          ruleId: rule.id,
          nonce: conversionData.nonce,
        }),
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

  // 确保积分类型可用
  private async assertPointTypesAvailable(fromPointTypeId: string, toPointTypeId: string) {
    if (fromPointTypeId === toPointTypeId) {
      throw new PointConversionRuleInvalidError('来源积分类型和目标积分类型不能相同');
    }

    await Promise.all([
      this.deps.pointTypeUseCase.getAvailableById(fromPointTypeId),
      this.deps.pointTypeUseCase.getAvailableById(toPointTypeId),
    ]);
  }

  private async assertRulePairAvailable(fromPointTypeId: string, toPointTypeId: string) {
    const exists = await this.deps.pointConversionRuleRepo.findByPointTypePair({
      fromPointTypeId,
      toPointTypeId,
    });

    if (exists) {
      throw new PointConversionRulePairExistsError();
    }
  }
}
