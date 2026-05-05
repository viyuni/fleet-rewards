import { describe, expect, it } from 'bun:test';

import { PointAmountInvalidError, PointAmountPolicy } from '../domain';

describe('积分数量策略', () => {
  describe('assertPositive', () => {
    it('允许正整数', () => {
      expect(() => PointAmountPolicy.assertPositiveInteger(1)).not.toThrow();
      expect(() => PointAmountPolicy.assertPositiveInteger(100)).not.toThrow();
    });

    it('拒绝零值', () => {
      expect(() => PointAmountPolicy.assertPositiveInteger(0)).toThrow(PointAmountInvalidError);
    });

    it('拒绝负数', () => {
      expect(() => PointAmountPolicy.assertPositiveInteger(-1)).toThrow(PointAmountInvalidError);
    });

    it('拒绝小数', () => {
      expect(() => PointAmountPolicy.assertPositiveInteger(1.5)).toThrow(PointAmountInvalidError);
    });

    it('拒绝非数字', () => {
      expect(() => PointAmountPolicy.assertPositiveInteger(Number.NaN)).toThrow(
        PointAmountInvalidError,
      );
    });
  });

  describe('assertNonZero', () => {
    it('允许正数', () => {
      expect(() => PointAmountPolicy.assertNonZeroInteger(1)).not.toThrow();
    });

    it('允许负数', () => {
      expect(() => PointAmountPolicy.assertNonZeroInteger(-1)).not.toThrow();
    });

    it('拒绝零值', () => {
      expect(() => PointAmountPolicy.assertNonZeroInteger(0)).toThrow(PointAmountInvalidError);
    });

    it('不允许小数', () => {
      expect(() => PointAmountPolicy.assertNonZeroInteger(1.5)).toThrow(PointAmountInvalidError);
    });
  });
});
