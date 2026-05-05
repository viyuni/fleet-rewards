import { afterAll, describe, expect, it } from 'bun:test';

import { createDatabase, type DbTransaction } from '@server/db';
import { pointAccounts, pointTypes } from '@server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { Pool } from 'pg';

import {
  PointAccountUpdateFailedError,
  PointAmountInvalidError,
  PointBalanceInsufficientError,
} from '../domain';
import { PointAccountRepository } from '../repository/point-account.repo';

const testDatabaseUrl = Bun.env.TEST_DATABASE_URL;
const describeWithDatabase = testDatabaseUrl ? describe : describe.skip;
const rollback = Symbol('rollback');
const pool = testDatabaseUrl ? new Pool({ connectionString: testDatabaseUrl }) : undefined;
const db = testDatabaseUrl ? createDatabase(testDatabaseUrl) : undefined;
const concurrentCount = 10;

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

async function runInTransaction<T>(callback: (tx: DbTransaction) => Promise<T>) {
  if (!db) {
    throw new Error('TEST_DATABASE_URL 未配置');
  }

  return await db.transaction(async tx => {
    await tx.execute(sql`set local lock_timeout = '1000ms'`);
    await tx.execute(sql`set local statement_timeout = '5000ms'`);

    return await callback(tx as DbTransaction);
  });
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

async function deletePointTypeById(pointTypeId: string) {
  if (!db) {
    throw new Error('TEST_DATABASE_URL 未配置');
  }

  await db.delete(pointAccounts).where(eq(pointAccounts.pointTypeId, pointTypeId));
  await db.delete(pointTypes).where(eq(pointTypes.id, pointTypeId));
}

async function createPointAccount(
  tx: DbTransaction,
  input: {
    pointTypeId: string;
    balance?: number;
    status?: 'active' | 'suspended' | 'banned';
    userId?: string;
  },
) {
  const [account] = await tx
    .insert(pointAccounts)
    .values({
      userId: input.userId ?? crypto.randomUUID(),
      pointTypeId: input.pointTypeId,
      balance: input.balance ?? 0,
      status: input.status ?? 'active',
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

describeWithDatabase('Point account repository', () => {
  const repository = new PointAccountRepository();

  describe('ensureAccount', () => {
    it('首次调用会创建默认账户', async () => {
      await withRollback(async tx => {
        const pointType = await createPointType(tx);
        const userId = crypto.randomUUID();

        const account = await PointAccountRepository.ensureAccountAndLock(tx, {
          userId,
          pointTypeId: pointType.id,
        });

        expect(account.userId).toBe(userId);
        expect(account.pointTypeId).toBe(pointType.id);
        expect(account.balance).toBe(0);
        expect(account.status).toBe('active');
      });
    });

    it('重复调用同一用户和积分类型不会重复创建', async () => {
      await withRollback(async tx => {
        const pointType = await createPointType(tx);
        const userId = crypto.randomUUID();

        const firstAccount = await PointAccountRepository.ensureAccountAndLock(tx, {
          userId,
          pointTypeId: pointType.id,
        });
        const secondAccount = await PointAccountRepository.ensureAccountAndLock(tx, {
          userId,
          pointTypeId: pointType.id,
        });
        const accounts = await tx
          .select()
          .from(pointAccounts)
          .where(eq(pointAccounts.userId, userId));

        expect(secondAccount.id).toBe(firstAccount.id);
        expect(accounts).toHaveLength(1);
      });
    });

    it(
      '并发调用同一用户和积分类型只会创建一个账户',
      async () => {
        const pointType = await runInTransaction(tx => createPointType(tx));
        const userId = crypto.randomUUID();

        try {
          const accounts = await Promise.all(
            Array.from({ length: concurrentCount }, () =>
              runInTransaction(tx =>
                PointAccountRepository.ensureAccountAndLock(tx, {
                  userId,
                  pointTypeId: pointType.id,
                }),
              ),
            ),
          );
          const persistedAccounts = await db
            ?.select()
            .from(pointAccounts)
            .where(eq(pointAccounts.userId, userId));

          expect(new Set(accounts.map(account => account.id)).size).toBe(1);
          expect(persistedAccounts).toHaveLength(1);
        } finally {
          await deletePointTypeById(pointType.id);
        }
      },
      { timeout: 10_000 },
    );
  });

  describe('increaseBalance', () => {
    it('active 账户可以增加余额', async () => {
      await withRollback(async tx => {
        const pointType = await createPointType(tx);
        const account = await createPointAccount(tx, { pointTypeId: pointType.id, balance: 10 });

        const updatedAccount = await PointAccountRepository.increaseBalance(tx, {
          accountId: account.id,
          amount: 5,
        });

        expect(updatedAccount.balance).toBe(15);
      });
    });

    it('suspended 账户可以增加余额', async () => {
      await withRollback(async tx => {
        const pointType = await createPointType(tx);
        const account = await createPointAccount(tx, {
          pointTypeId: pointType.id,
          balance: 10,
          status: 'suspended',
        });

        const updatedAccount = await PointAccountRepository.increaseBalance(tx, {
          accountId: account.id,
          amount: 5,
        });

        expect(updatedAccount.balance).toBe(15);
      });
    });

    it('banned 账户不能增加余额', async () => {
      await withRollback(async tx => {
        const pointType = await createPointType(tx);
        const account = await createPointAccount(tx, {
          pointTypeId: pointType.id,
          status: 'banned',
        });

        await expectRejectsWith(
          PointAccountRepository.increaseBalance(tx, {
            accountId: account.id,
            amount: 5,
          }),
          PointAccountUpdateFailedError,
        );
      });
    });

    it('非正整数金额会被拒绝', async () => {
      await withRollback(async tx => {
        await expectRejectsWith(
          PointAccountRepository.increaseBalance(tx, {
            accountId: crypto.randomUUID(),
            amount: 0,
          }),
          PointAmountInvalidError,
        );
        await expectRejectsWith(
          PointAccountRepository.increaseBalance(tx, {
            accountId: crypto.randomUUID(),
            amount: -1,
          }),
          PointAmountInvalidError,
        );
        await expectRejectsWith(
          PointAccountRepository.increaseBalance(tx, {
            accountId: crypto.randomUUID(),
            amount: 1.5,
          }),
          PointAmountInvalidError,
        );
      });
    });

    it(
      '并发增加余额不会丢失更新',
      async () => {
        const pointType = await runInTransaction(tx => createPointType(tx));

        try {
          const account = await runInTransaction(tx =>
            createPointAccount(tx, { pointTypeId: pointType.id, balance: 0 }),
          );

          await Promise.all(
            Array.from({ length: concurrentCount }, () =>
              runInTransaction(tx =>
                PointAccountRepository.increaseBalance(tx, {
                  accountId: account.id,
                  amount: 1,
                }),
              ),
            ),
          );

          // @ts-ignore
          // oxlint-disable-next-line no-unsafe-optional-chaining
          const [currentAccount] = await db
            ?.select()
            .from(pointAccounts)
            .where(eq(pointAccounts.id, account.id));

          expect(currentAccount?.balance).toBe(concurrentCount);
        } finally {
          await deletePointTypeById(pointType.id);
        }
      },
      { timeout: 10_000 },
    );
  });

  describe('decreaseBalance', () => {
    it('active 且余额足够时可以扣减余额', async () => {
      await withRollback(async tx => {
        const pointType = await createPointType(tx);
        const account = await createPointAccount(tx, { pointTypeId: pointType.id, balance: 10 });

        const updatedAccount = await PointAccountRepository.decreaseBalance(tx, {
          accountId: account.id,
          amount: 4,
        });

        expect(updatedAccount.balance).toBe(6);
      });
    });

    it('余额不足时不能扣减余额', async () => {
      await withRollback(async tx => {
        const pointType = await createPointType(tx);
        const account = await createPointAccount(tx, { pointTypeId: pointType.id, balance: 3 });

        await expectRejectsWith(
          PointAccountRepository.decreaseBalance(tx, {
            accountId: account.id,
            amount: 4,
          }),
          PointBalanceInsufficientError,
        );

        const [currentAccount] = await tx
          .select()
          .from(pointAccounts)
          .where(eq(pointAccounts.id, account.id));

        expect(currentAccount?.balance).toBe(3);
      });
    });

    it('suspended 账户不能扣减余额', async () => {
      await withRollback(async tx => {
        const pointType = await createPointType(tx);
        const account = await createPointAccount(tx, {
          pointTypeId: pointType.id,
          balance: 10,
          status: 'suspended',
        });

        await expectRejectsWith(
          PointAccountRepository.decreaseBalance(tx, {
            accountId: account.id,
            amount: 4,
          }),
          PointBalanceInsufficientError,
        );
      });
    });

    it('banned 账户不能扣减余额', async () => {
      await withRollback(async tx => {
        const pointType = await createPointType(tx);
        const account = await createPointAccount(tx, {
          pointTypeId: pointType.id,
          balance: 10,
          status: 'banned',
        });

        await expectRejectsWith(
          PointAccountRepository.decreaseBalance(tx, {
            accountId: account.id,
            amount: 4,
          }),
          PointBalanceInsufficientError,
        );
      });
    });

    it('非正整数金额会被拒绝', async () => {
      await withRollback(async tx => {
        await expectRejectsWith(
          PointAccountRepository.decreaseBalance(tx, {
            accountId: crypto.randomUUID(),
            amount: 0,
          }),
          PointAmountInvalidError,
        );
        await expectRejectsWith(
          PointAccountRepository.decreaseBalance(tx, {
            accountId: crypto.randomUUID(),
            amount: -1,
          }),
          PointAmountInvalidError,
        );
        await expectRejectsWith(
          PointAccountRepository.decreaseBalance(tx, {
            accountId: crypto.randomUUID(),
            amount: 1.5,
          }),
          PointAmountInvalidError,
        );
      });
    });

    it(
      '并发扣减余额不会扣成负数',
      async () => {
        const pointType = await runInTransaction(tx => createPointType(tx));

        try {
          const account = await runInTransaction(tx =>
            createPointAccount(tx, { pointTypeId: pointType.id, balance: 5 }),
          );
          const results = await Promise.allSettled(
            Array.from({ length: concurrentCount }, () =>
              runInTransaction(tx =>
                PointAccountRepository.decreaseBalance(tx, {
                  accountId: account.id,
                  amount: 1,
                }),
              ),
            ),
          );

          const [currentAccount] = await db!
            .select()
            .from(pointAccounts)
            .where(eq(pointAccounts.id, account.id));

          expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(5);
          expect(results.filter(result => result.status === 'rejected')).toHaveLength(5);
          expect(currentAccount?.balance).toBe(0);
        } finally {
          await deletePointTypeById(pointType.id);
        }
      },
      { timeout: 10_000 },
    );
  });
});
