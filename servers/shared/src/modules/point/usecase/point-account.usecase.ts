import type { DbTransaction } from '#server/shared/db';
import { pointTransactions } from '#server/shared/db/schemas';
import { UserUnavailableError } from '#server/shared/errors';

import { UserRepository } from '../../user';
import type { ChangeBalanceInput } from '../domain/index';
import { PointAmountPolicy } from '../domain/index';
import { PointAccountRepository } from '../repository/point-account.repo';

export class PointUseCase {
  private pointAccountRepo = new PointAccountRepository();

  async changeBalance(tx: DbTransaction, input: ChangeBalanceInput) {
    const userRepo = new UserRepository(tx);

    const user = await userRepo.findAvailableById(input.userId);

    // 确保用户存在且没被封禁
    if (!user) {
      throw new UserUnavailableError();
    }

    // 确保变动金额不为0
    PointAmountPolicy.assertNonZero(input.delta);

    // 确保账户存在并锁行
    const account = await this.pointAccountRepo.ensureAccount(tx, input);

    // 积分账户余额更新
    const updatedAccount =
      input.delta > 0
        ? await this.pointAccountRepo.increaseBalance(tx, {
            accountId: account.id,
            amount: input.delta,
          })
        : await this.pointAccountRepo.decreaseBalance(tx, {
            accountId: account.id,
            // 确保 delta 为正, 扣除时只能为正数
            amount: Math.abs(input.delta),
          });

    // 积分交易记录
    await tx.insert(pointTransactions).values({
      userId: input.userId,
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
    });

    return updatedAccount;
  }
}
