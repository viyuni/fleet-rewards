import type { DbTransaction } from '@server/db';
import { pointTransactions, type PointAccount } from '@server/db/schema';

import { UserUseCase } from '#server/shared/modules/user';

import type { ChangeBalanceInput } from '../domain';
import {
  PointAccountPolicy,
  PointAmountPolicy,
  PointTransactionCreateFailedError,
  PointTransactionPolicy,
} from '../domain';
import { PointAccountRepository } from '../repository/point-account.repo';
import type { PointTypeUseCase } from './point-type.usecase';

export class PointBalanceUseCase {
  constructor(
    private readonly deps: {
      pointAccountRepo: PointAccountRepository;
      pointTypeUseCase: PointTypeUseCase;
      userUseCase: UserUseCase;
    },
  ) {}

  async changeBalance(tx: DbTransaction, account: PointAccount, input: ChangeBalanceInput) {
    PointAmountPolicy.assertNonZeroInteger(input.delta);
    PointTransactionPolicy.assertDeltaMatchesType(input.type, input.delta);

    // 获取积分类型, 用于存快照
    const pointType = await this.deps.pointTypeUseCase.requireAvailableById(input.pointTypeId, tx);

    // 获取用户
    const user = await this.deps.userUseCase.requireAvailableById(input.userId, tx);

    let updatedAccount: PointAccount;

    if (input.delta > 0) {
      // 添加积分
      PointAccountPolicy.assertCanIncrease(account);

      updatedAccount = await this.deps.pointAccountRepo.increaseBalance(tx, {
        accountId: account.id,
        amount: input.delta,
      });
    } else {
      // 扣除积分
      const amount = Math.abs(input.delta);

      PointAccountPolicy.assertCanConsume(account);
      PointAccountPolicy.assertSufficientBalance(account, amount);

      updatedAccount = await this.deps.pointAccountRepo.decreaseBalance(tx, {
        accountId: account.id,
        amount,
      });
    }

    // 创建积分流水
    const [transaction] = await tx
      .insert(pointTransactions)
      .values({
        userId: user.id,
        pointAccountId: account.id,
        pointTypeId: input.pointTypeId,
        pointTypeNameSnapshot: pointType.name,
        type: input.type,
        delta: input.delta,
        balanceBefore: account.balance,
        balanceAfter: updatedAccount.balance,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        idempotencyKey: input.idempotencyKey,
        remark: input.remark,
        metadata: input.metadata,
        // 仅当流水类型为 reversal 时，才记录 reversalOfTransactionId
        reversalOfTransactionId:
          input.type === 'reversal' ? input.reversalOfTransactionId : undefined,
      })
      .returning();

    if (!transaction) {
      throw new PointTransactionCreateFailedError();
    }

    return {
      transaction,
      account: updatedAccount,
    };
  }
}
