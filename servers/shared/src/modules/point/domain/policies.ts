import { PointAmountInvalidError } from './errors';

export class PointAmountPolicy {
  static assertPositive(amount: number) {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new PointAmountInvalidError('积分数量必须大于 0');
    }
  }

  static assertNonZero(delta: number) {
    if (delta === 0) {
      throw new PointAmountInvalidError('积分变动数量不能为 0');
    }
  }

  static assertAdjustAmount(amount: number) {
    if (amount === 0) {
      throw new PointAmountInvalidError('积分调整数量不能为 0');
    }
  }
}
