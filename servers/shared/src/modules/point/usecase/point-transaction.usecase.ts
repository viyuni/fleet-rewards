import type { PointTransactionPageQuery, ReversalPointTransactionBody } from '@internal/shared';
import type { DbClient } from '@server/db';

import { POINT_CHANGE_SOURCE_TYPE, PointTransactionAlreadyReversedError } from '../domain';
import { PointAccountRepository, PointTransactionRepository } from '../repository';
import { PointBalanceUseCase } from './point-balance.usecase';

export interface PointTransactionUseCaseDeps {
  db: DbClient;
  pointAccountRepo: PointAccountRepository;
  pointBalanceUseCase: PointBalanceUseCase;
  pointTransactionRepo: PointTransactionRepository;
}

export class PointTransactionUseCase {
  constructor(private readonly deps: PointTransactionUseCaseDeps) {}

  /**
   * 冲正积分流水
   */
  async reversal(adminId: string, data: ReversalPointTransactionBody) {
    return this.deps.db.transaction(async tx => {
      // 获取原始积分交易记录并行锁
      const original = await this.deps.pointTransactionRepo.requireByIdForUpdate(
        tx,
        data.transactionId,
      );

      // 不允许重复冲正
      if (original.reversalOfTransactionId) {
        throw new PointTransactionAlreadyReversedError();
      }

      // 锁账户
      const account = await this.deps.pointAccountRepo.requireByIdForUpdate(
        tx,
        original.pointAccountId,
      );

      //  反转
      const reversalDelta = -original.delta;

      return await this.deps.pointBalanceUseCase.changeBalance(tx, account, {
        type: 'reversal',
        userId: original.userId,
        pointTypeId: original.pointTypeId,
        delta: reversalDelta,
        sourceType: POINT_CHANGE_SOURCE_TYPE.Reversal,
        sourceId: original.id,
        idempotencyKey: `point-transaction:${original.id}:reversal`,
        remark: data.remark ?? '积分流水冲正',
        metadata: {
          originalTransactionId: original.id,
          operatorId: adminId,
        },
        reversalOfTransactionId: original.id,
      });
    });
  }

  page(query: PointTransactionPageQuery) {
    return this.deps.pointTransactionRepo.page(query);
  }

  pageByUserId(userId: string, query: PointTransactionPageQuery) {
    return this.deps.pointTransactionRepo.pageByUserId(userId, query);
  }
}
