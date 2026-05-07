import { expect, it } from 'bun:test';

import { pointTransactions } from '@server/db/schema';
import { count, eq } from 'drizzle-orm';

import {
  countFulfilled,
  countRejected,
  runConcurrent,
} from '../../../__tests__/helpers/concurrency';
import {
  createDeps,
  db,
  describeWithDatabase,
  grantPoints,
  installConcurrencyTestHooks,
  newBatch,
  seedPointType,
  seedUser,
} from './concurrency-test-utils';

installConcurrencyTestHooks();

describeWithDatabase('积分账户真实数据库并发保护', () => {
  it('积分账户不会并发超扣', async () => {
    const prefix = newBatch();
    const pointType = await seedPointType(`${prefix}_balance_point`);
    const user = await seedUser(`${prefix}_user`);
    const { pointAccountUseCase } = createDeps();

    await grantPoints({
      adminId: `${prefix}_admin`,
      userId: user.id,
      pointTypeId: pointType.id,
      delta: 3,
      nonce: `${prefix}_grant`,
    });

    const account = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: pointType.id },
    });

    if (!account) throw new Error('seed account failed');

    const results = await runConcurrent(10, index =>
      pointAccountUseCase.adjustBalance(`${prefix}_admin_${index}`, {
        userId: user.id,
        pointTypeId: pointType.id,
        delta: -1,
        nonce: `${prefix}_consume_${index}`,
      }),
    );

    const current = await db.query.pointAccounts.findFirst({ where: { id: account.id } });

    expect(countFulfilled(results)).toBe(3);
    expect(countRejected(results)).toBe(7);
    expect(current?.balance).toBe(0);
  });

  it('积分流水保持唯一', async () => {
    const prefix = newBatch();
    const pointType = await seedPointType(`${prefix}_transaction_unique_point`);
    const user = await seedUser(`${prefix}_transaction_user`);
    const { pointAccountUseCase } = createDeps();

    const results = await runConcurrent(5, () =>
      pointAccountUseCase.adjustBalance(`${prefix}_admin`, {
        userId: user.id,
        pointTypeId: pointType.id,
        delta: 1,
        nonce: `${prefix}_same_key`,
      }),
    );

    const [row] = await db
      .select({ total: count() })
      .from(pointTransactions)
      .where(
        eq(
          pointTransactions.idempotencyKey,
          `admin:points:adjust:${prefix}_admin:${prefix}_same_key`,
        ),
      );
    const account = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: pointType.id },
    });

    expect(countFulfilled(results)).toBe(1);
    expect(countRejected(results)).toBe(4);
    expect(row?.total).toBe(1);
    expect(account?.balance).toBe(1);
  });
});
