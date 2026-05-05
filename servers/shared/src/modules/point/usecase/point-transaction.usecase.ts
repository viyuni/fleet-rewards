import type { ReversalTransactionInput } from '@internal/shared';
import type { DbExecutor } from '@server/db';

import { POINT_CHANGE_SOURCE_TYPE, PointTransactionAlreadyReversedError } from '../domain';
import { PointAccountRepository, PointTransactionRepository } from '../repository';
import { PointBalanceUseCase } from './point-balance.usecase';

export class PointTransactionUseCase {
  pointTransactionRepo: PointTransactionRepository;
  constructor(private readonly db: DbExecutor) {
    this.pointTransactionRepo = new PointTransactionRepository(db);
  }

  /**
   * 冲正积分流水
   */
  async reversal(adminId: string, { transactionId, remark }: ReversalTransactionInput) {
    return this.db.transaction(async tx => {
      // 获取原始积分交易记录并行锁
      const original = await PointTransactionRepository.requireByIdForUpdate(tx, transactionId);

      // 不允许重复冲正
      if (original.reversalOfTransactionId) {
        throw new PointTransactionAlreadyReversedError();
      }

      // 锁账户
      const account = await PointAccountRepository.requireByIdForUpdate(
        tx,
        original.pointAccountId,
      );

      //  反转
      const reversalDelta = -original.delta;

      return await PointBalanceUseCase.changeBalance(tx, account, {
        type: 'reversal',
        userId: original.userId,
        pointTypeId: original.pointTypeId,
        delta: reversalDelta,
        sourceType: POINT_CHANGE_SOURCE_TYPE.Reversal,
        sourceId: original.id,
        idempotencyKey: `point-transaction:${original.id}:reversal`,
        remark: remark ?? '积分流水冲正',
        metadata: {
          originalTransactionId: original.id,
          operatorId: adminId,
        },
        reversalOfTransactionId: original.id,
      });
    });
  }
}
