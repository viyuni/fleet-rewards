import type { PointConversionRule } from '@server/db/schema';

import { PointConversionRuleInvalidError, PointConversionRuleUnavailableError } from './errors';

export class PointConversionRulePolicy {
  static assertValidShape(input: {
    fromPointTypeId?: string;
    toPointTypeId?: string;
    fromAmount?: number;
    toAmount?: number;
    minFromAmount?: number | null;
    maxFromAmount?: number | null;
    startsAt?: Date | null;
    endsAt?: Date | null;
  }) {
    if (
      input.fromPointTypeId !== undefined &&
      input.toPointTypeId !== undefined &&
      input.fromPointTypeId === input.toPointTypeId
    ) {
      throw new PointConversionRuleInvalidError('来源积分类型和目标积分类型不能相同');
    }

    if (input.fromAmount !== undefined && input.fromAmount <= 0) {
      throw new PointConversionRuleInvalidError('来源积分数量必须大于 0');
    }

    if (input.toAmount !== undefined && input.toAmount <= 0) {
      throw new PointConversionRuleInvalidError('目标积分数量必须大于 0');
    }

    if (
      input.minFromAmount !== undefined &&
      input.maxFromAmount !== undefined &&
      input.minFromAmount !== null &&
      input.maxFromAmount !== null &&
      input.minFromAmount > input.maxFromAmount
    ) {
      throw new PointConversionRuleInvalidError('最小转换数量不能大于最大转换数量');
    }

    if (
      input.startsAt !== undefined &&
      input.endsAt !== undefined &&
      input.startsAt !== null &&
      input.endsAt !== null &&
      input.startsAt >= input.endsAt
    ) {
      throw new PointConversionRuleInvalidError('生效时间必须早于失效时间');
    }
  }

  static assertAvailable(rule: PointConversionRule, now = new Date()) {
    if (!rule.enabled) {
      throw new PointConversionRuleUnavailableError('积分转换规则已停用');
    }

    if (rule.startsAt && rule.startsAt > now) {
      throw new PointConversionRuleUnavailableError('积分转换规则尚未生效');
    }

    if (rule.endsAt && rule.endsAt <= now) {
      throw new PointConversionRuleUnavailableError('积分转换规则已失效');
    }
  }

  static calculateToAmount(rule: PointConversionRule, fromAmount: number) {
    if (fromAmount <= 0) {
      throw new PointConversionRuleInvalidError('转换数量必须大于 0');
    }

    if (rule.minFromAmount !== null && fromAmount < rule.minFromAmount) {
      throw new PointConversionRuleInvalidError(`转换数量不能小于 ${rule.minFromAmount}`);
    }

    if (rule.maxFromAmount !== null && fromAmount > rule.maxFromAmount) {
      throw new PointConversionRuleInvalidError(`转换数量不能大于 ${rule.maxFromAmount}`);
    }

    if (fromAmount % rule.fromAmount !== 0) {
      throw new PointConversionRuleInvalidError(`转换数量必须是 ${rule.fromAmount} 的整数倍`);
    }

    return (fromAmount / rule.fromAmount) * rule.toAmount;
  }
}
