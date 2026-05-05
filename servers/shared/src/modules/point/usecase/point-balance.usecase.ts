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

export class PointBalanceUseCase {
  static async changeBalance(tx: DbTransaction, account: PointAccount, input: ChangeBalanceInput) {
    PointAmountPolicy.assertNonZeroInteger(input.delta);
    PointTransactionPolicy.assertDeltaMatchesType(input.type, input.delta);

    const user = await UserUseCase.requireAvailableById(tx, input.userId);

    let updatedAccount: PointAccount;

    if (input.delta > 0) {
      PointAccountPolicy.assertCanIncrease(account);

      updatedAccount = await PointAccountRepository.increaseBalance(tx, {
        accountId: account.id,
        amount: input.delta,
      });
    } else {
      const amount = Math.abs(input.delta);

      PointAccountPolicy.assertCanConsume(account);
      PointAccountPolicy.assertSufficientBalance(account, amount);

      updatedAccount = await PointAccountRepository.decreaseBalance(tx, {
        accountId: account.id,
        amount,
      });
    }

    const [transaction] = await tx
      .insert(pointTransactions)
      .values({
        userId: user.id,
        pointAccountId: account.id,
        pointTypeId: input.pointTypeId,
        type: input.type,
        delta: input.delta,
        balanceBefore: account.balance,
        balanceAfter: updatedAccount.balance,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        idempotencyKey: input.idempotencyKey,
        remark: input.remark,
        metadata: input.metadata,
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
