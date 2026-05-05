import type { DbTransaction } from '@server/db';
import { pointAccounts } from '@server/db/schema';
import { and, eq, gte, inArray, sql } from 'drizzle-orm';

import {
  PointAccountEnsureFailedError,
  PointAccountNotFoundError,
  PointAccountUpdateFailedError,
  PointAmountPolicy,
  PointBalanceInsufficientError,
} from '../domain';

export class PointAccountRepository {
  /**
   * 确保积分账户存在, 并行锁
   */
  static async ensureAccountAndLock(
    tx: DbTransaction,
    input: { userId: string; pointTypeId: string },
  ) {
    await tx
      .insert(pointAccounts)
      .values({
        userId: input.userId,
        pointTypeId: input.pointTypeId,
        balance: 0,
      })
      .onConflictDoNothing({
        target: [pointAccounts.userId, pointAccounts.pointTypeId],
      });

    const [account] = await tx
      .select()
      .from(pointAccounts)
      .where(
        and(
          eq(pointAccounts.userId, input.userId),
          eq(pointAccounts.pointTypeId, input.pointTypeId),
        ),
      )
      .for('update');

    if (!account) {
      throw new PointAccountEnsureFailedError();
    }

    return account;
  }

  /**
   * 查询积分账户并行锁
   */
  static async requireByIdForUpdate(tx: DbTransaction, accountId: string) {
    const [account] = await tx
      .select()
      .from(pointAccounts)
      .where(eq(pointAccounts.id, accountId))
      .for('update');

    if (!account) {
      throw new PointAccountNotFoundError();
    }

    return account;
  }

  /**
   * 积分账户余额增加
   * @param input.accountId 积分账户ID
   * @param input.amount 增加的积分数量, 必须大于0
   */
  static async increaseBalance(tx: DbTransaction, input: { accountId: string; amount: number }) {
    PointAmountPolicy.assertPositiveInteger(input.amount);

    const [updatedAccount] = await tx
      .update(pointAccounts)
      .set({
        balance: sql`${pointAccounts.balance} + ${input.amount}`,
      })
      .where(
        and(
          eq(pointAccounts.id, input.accountId),
          // 账户状态为激活或挂起
          inArray(pointAccounts.status, ['active', 'suspended']),
        ),
      )
      .returning();

    if (!updatedAccount) {
      throw new PointAccountUpdateFailedError();
    }

    return updatedAccount;
  }

  /**
   * 积分账户余额扣除
   * @param input.accountId 积分账户ID
   * @param input.amount 扣除的积分数量, 必须大于0
   */
  static async decreaseBalance(tx: DbTransaction, input: { accountId: string; amount: number }) {
    PointAmountPolicy.assertPositiveInteger(input.amount);

    const [updatedAccount] = await tx
      .update(pointAccounts)
      .set({
        balance: sql`${pointAccounts.balance} - ${input.amount}`,
      })
      .where(
        and(
          eq(pointAccounts.id, input.accountId),
          gte(pointAccounts.balance, input.amount),
          // 账户状态为激活
          eq(pointAccounts.status, 'active'),
        ),
      )
      .returning();

    if (!updatedAccount) {
      throw new PointBalanceInsufficientError();
    }

    return updatedAccount;
  }
}
