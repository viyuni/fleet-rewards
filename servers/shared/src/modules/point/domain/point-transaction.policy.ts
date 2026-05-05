import type { PointTransactionType } from '@server/db/schema';

import { InvalidPointTransactionDeltaError } from './errors';

export class PointTransactionPolicy {
  static assertDeltaMatchesType(type: PointTransactionType, delta: number) {
    if (type === 'grant' && delta <= 0) {
      throw new InvalidPointTransactionDeltaError('发放积分 delta 必须大于 0');
    }

    if (type === 'consume' && delta >= 0) {
      throw new InvalidPointTransactionDeltaError('消费积分 delta 必须小于 0');
    }

    if (type === 'refund' && delta <= 0) {
      throw new InvalidPointTransactionDeltaError('退款返还积分 delta 必须大于 0');
    }

    if (type === 'adjust' && delta === 0) {
      throw new InvalidPointTransactionDeltaError('管理员调整 delta 不能为 0');
    }

    if (type === 'reversal' && delta === 0) {
      throw new InvalidPointTransactionDeltaError('冲正流水 delta 不能为 0');
    }
  }
}
