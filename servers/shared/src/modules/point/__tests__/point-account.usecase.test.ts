import { afterAll, describe, expect, it } from 'bun:test';

import { createDatabase, type DbTransaction } from '@server/db';
import { pointAccounts, pointTransactions, pointTypes, users } from '@server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { Pool } from 'pg';

import { UserUnavailableError } from '#server/shared/modules/user';

import { PointAmountInvalidError, PointBalanceInsufficientError } from '../domain';
import { PointAccountRepository } from '../repository';
import { PointBalanceUseCase } from '../usecase/point-balance.usecase';

const testDatabaseUrl = Bun.env.TEST_DATABASE_URL;
const describeWithDatabase = testDatabaseUrl ? describe : describe.skip;
const rollback = Symbol('rollback');
const pool = testDatabaseUrl ? new Pool({ connectionString: testDatabaseUrl }) : undefined;
const db = testDatabaseUrl ? createDatabase(testDatabaseUrl) : undefined;

async function withRollback(callback: (tx: DbTransaction) => Promise<void>) {
  if (!db) {
    throw new Error('TEST_DATABASE_URL 未配置');
  }

  try {
    await db.transaction(async tx => {
      await tx.execute(sql`set local lock_timeout = '500ms'`);
      await tx.execute(sql`set local statement_timeout = '3000ms'`);
      await callback(tx as DbTransaction);
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) {
      throw error;
    }
  }
}

async function expectRejectsWith(errorPromise: Promise<unknown>, errorClass: new () => Error) {
  try {
    await errorPromise;
  } catch (error) {
    expect(error).toBeInstanceOf(errorClass);
    return;
  }

  throw new Error(`预期抛出 ${errorClass.name}`);
}

async function createUser(tx: DbTransaction, status: 'normal' | 'banned' = 'normal') {
  const id = crypto.randomUUID();

  const [user] = await tx
    .insert(users)
    .values({
      id,
      biliUid: `bili_${id}`,
      username: `测试用户_${id}`,
      passwordHash: 'hashed_password',
      status,
    })
    .returning();

  if (!user) {
    throw new Error('测试用户创建失败');
  }

  return user;
}

async function createPointType(tx: DbTransaction) {
  const id = crypto.randomUUID();

  const [pointType] = await tx
    .insert(pointTypes)
    .values({
      id,
      name: `测试积分 ${id}`,
    })
    .returning();

  if (!pointType) {
    throw new Error('测试积分类型创建失败');
  }

  return pointType;
}

async function createPointAccount(
  tx: DbTransaction,
  input: {
    userId: string;
    pointTypeId: string;
    balance?: number;
  },
) {
  const [account] = await tx
    .insert(pointAccounts)
    .values({
      userId: input.userId,
      pointTypeId: input.pointTypeId,
      balance: input.balance ?? 0,
    })
    .returning();

  if (!account) {
    throw new Error('测试积分账户创建失败');
  }

  return account;
}

afterAll(async () => {
  await pool?.end();
});

describeWithDatabase('积分账户 UseCase', () => {
  it('banned 用户拒绝变更积分', async () => {
    await withRollback(async tx => {
      const user = await createUser(tx, 'banned');
      const pointType = await createPointType(tx);
      const account = await createPointAccount(tx, {
        userId: user.id,
        pointTypeId: pointType.id,
      });
      const lockedAccount = await PointAccountRepository.requireByIdForUpdate(tx, account.id);

      await expectRejectsWith(
        PointBalanceUseCase.changeBalance(tx, lockedAccount, {
          type: 'grant',
          userId: user.id,
          pointTypeId: pointType.id,
          delta: 10,
          sourceType: 'guard_event',
          sourceId: 'event:banned-user',
          idempotencyKey: `banned-user:${crypto.randomUUID()}`,
        }),
        UserUnavailableError,
      );
    });
  });

  it('拒绝零值积分变更', async () => {
    await withRollback(async tx => {
      const user = await createUser(tx);
      const pointType = await createPointType(tx);
      const account = await createPointAccount(tx, {
        userId: user.id,
        pointTypeId: pointType.id,
      });
      const lockedAccount = await PointAccountRepository.requireByIdForUpdate(tx, account.id);

      await expectRejectsWith(
        PointBalanceUseCase.changeBalance(tx, lockedAccount, {
          type: 'grant',
          userId: user.id,
          pointTypeId: pointType.id,
          delta: 0,
          sourceType: 'guard_event',
          sourceId: 'event:zero-delta',
          idempotencyKey: `zero-delta:${crypto.randomUUID()}`,
        }),
        PointAmountInvalidError,
      );
    });
  });

  it('正数 delta 会增加余额并写入积分流水', async () => {
    await withRollback(async tx => {
      const user = await createUser(tx);
      const pointType = await createPointType(tx);
      const account = await createPointAccount(tx, {
        userId: user.id,
        pointTypeId: pointType.id,
      });
      const lockedAccount = await PointAccountRepository.requireByIdForUpdate(tx, account.id);
      const idempotencyKey = `grant:${crypto.randomUUID()}`;
      const result = await PointBalanceUseCase.changeBalance(tx, lockedAccount, {
        type: 'grant',
        userId: user.id,
        pointTypeId: pointType.id,
        delta: 10,
        sourceType: 'guard_event',
        sourceId: 'event:grant',
        idempotencyKey,
        remark: '测试发放积分',
        metadata: { reason: 'unit-test' },
      });
      const [transaction] = await tx
        .select()
        .from(pointTransactions)
        .where(eq(pointTransactions.idempotencyKey, idempotencyKey));
      expect(result.account.balance).toBe(10);
      expect(transaction?.userId).toBe(user.id);
      expect(transaction?.pointAccountId).toBe(account.id);
      expect(transaction?.pointTypeId).toBe(pointType.id);
      expect(transaction?.type).toBe('grant');
      expect(transaction?.delta).toBe(10);
      expect(transaction?.balanceBefore).toBe(0);
      expect(transaction?.balanceAfter).toBe(10);
      expect(transaction?.sourceType).toBe('guard_event');
      expect(transaction?.sourceId).toBe('event:grant');
      expect(transaction?.idempotencyKey).toBe(idempotencyKey);
      expect(transaction?.remark).toBe('测试发放积分');
      expect(transaction?.metadata).toEqual({ reason: 'unit-test' });
      expect(transaction?.reversalOfTransactionId).toBeNull();
    });
  });

  it('负数 delta 会扣减余额并写入积分流水', async () => {
    await withRollback(async tx => {
      const user = await createUser(tx);
      const pointType = await createPointType(tx);
      const account = await createPointAccount(tx, {
        userId: user.id,
        pointTypeId: pointType.id,
        balance: 10,
      });
      const lockedAccount = await PointAccountRepository.requireByIdForUpdate(tx, account.id);
      const idempotencyKey = `consume:${crypto.randomUUID()}`;
      const result = await PointBalanceUseCase.changeBalance(tx, lockedAccount, {
        type: 'consume',
        userId: user.id,
        pointTypeId: pointType.id,
        delta: -4,
        sourceType: 'order_consume',
        sourceId: 'order:consume',
        idempotencyKey,
      });
      const [transaction] = await tx
        .select()
        .from(pointTransactions)
        .where(eq(pointTransactions.idempotencyKey, idempotencyKey));

      expect(result.account.pointTypeId).toBe(pointType.id);
      expect(result.account.balance).toBe(6);
      expect(transaction?.pointAccountId).toBe(account.id);
      expect(transaction?.type).toBe('consume');
      expect(transaction?.delta).toBe(-4);
      expect(transaction?.balanceBefore).toBe(10);
      expect(transaction?.balanceAfter).toBe(6);
    });
  });

  it('余额不足时拒绝扣减且不写入积分流水', async () => {
    await withRollback(async tx => {
      const user = await createUser(tx);
      const pointType = await createPointType(tx);
      const account = await createPointAccount(tx, {
        userId: user.id,
        pointTypeId: pointType.id,
        balance: 3,
      });
      const lockedAccount = await PointAccountRepository.requireByIdForUpdate(tx, account.id);
      const idempotencyKey = `consume-insufficient:${crypto.randomUUID()}`;

      await expectRejectsWith(
        PointBalanceUseCase.changeBalance(tx, lockedAccount, {
          type: 'consume',
          userId: user.id,
          pointTypeId: pointType.id,
          delta: -4,
          sourceType: 'order_consume',
          sourceId: 'order:insufficient',
          idempotencyKey,
        }),
        PointBalanceInsufficientError,
      );

      const transactions = await tx
        .select()
        .from(pointTransactions)
        .where(eq(pointTransactions.idempotencyKey, idempotencyKey));

      expect(transactions).toHaveLength(0);
    });
  });

  it('冲正流水会写入被冲正流水 ID', async () => {
    await withRollback(async tx => {
      const user = await createUser(tx);
      const pointType = await createPointType(tx);
      const account = await createPointAccount(tx, {
        userId: user.id,
        pointTypeId: pointType.id,
        balance: 10,
      });
      const lockedAccount = await PointAccountRepository.requireByIdForUpdate(tx, account.id);
      const reversalOfTransactionId = crypto.randomUUID();
      const idempotencyKey = `reversal:${crypto.randomUUID()}`;

      await PointBalanceUseCase.changeBalance(tx, lockedAccount, {
        type: 'reversal',
        userId: user.id,
        pointTypeId: pointType.id,
        delta: -3,
        sourceType: 'reversal',
        sourceId: 'reversal:test',
        idempotencyKey,
        reversalOfTransactionId,
      });

      const [transaction] = await tx
        .select()
        .from(pointTransactions)
        .where(eq(pointTransactions.idempotencyKey, idempotencyKey));

      expect(transaction?.type).toBe('reversal');
      expect(transaction?.reversalOfTransactionId).toBe(reversalOfTransactionId);
    });
  });
});
