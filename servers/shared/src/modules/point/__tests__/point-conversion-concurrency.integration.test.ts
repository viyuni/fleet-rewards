import { expect, it } from 'bun:test';

import { pointAccounts, pointTransactions } from '@server/db/schema';
import { and, count, eq } from 'drizzle-orm';

import {
  PointAccountBannedError,
  PointConversionRuleInvalidError,
  PointConversionRuleUnavailableError,
} from '..';
import {
  countFulfilled,
  countRejected,
  runConcurrent,
} from '../../../__tests__/helpers/concurrency';
import {
  createConversionRule,
  createDeps,
  db,
  describeWithDatabase,
  expectRejectsInstanceOf,
  grantPoints,
  installConcurrencyTestHooks,
  newBatch,
  seedConversionFixture,
  seedPointType,
  seedUser,
} from './concurrency-test-utils';

installConcurrencyTestHooks();

describeWithDatabase('积分转换真实数据库并发保护', () => {
  it('积分转换不会并发超扣', async () => {
    const prefix = newBatch();
    const fromPointType = await seedPointType(`${prefix}_from_point`);
    const toPointType = await seedPointType(`${prefix}_to_point`);
    const user = await seedUser(`${prefix}_conversion_user`);
    const { pointConversionUseCase } = createDeps();
    const rule = await createConversionRule(prefix, fromPointType.id, toPointType.id);

    await grantPoints({
      adminId: `${prefix}_admin`,
      userId: user.id,
      pointTypeId: fromPointType.id,
      delta: 3,
      nonce: `${prefix}_grant_from`,
    });

    const results = await runConcurrent(10, index =>
      pointConversionUseCase.convert({
        userId: user.id,
        ruleId: rule.id,
        fromAmount: 1,
        nonce: `${prefix}_${index}`,
      }),
    );

    const fromAccount = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: fromPointType.id },
    });
    const toAccount = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: toPointType.id },
    });

    expect(countFulfilled(results)).toBe(3);
    expect(countRejected(results)).toBe(7);
    expect(fromAccount?.balance).toBe(0);
    expect(toAccount?.balance).toBe(30);
  });

  it('积分转换错误规则会被拒绝', async () => {
    const prefix = newBatch();
    const pointType = await seedPointType(`${prefix}_invalid_conversion_point`);
    const { pointConversionUseCase } = createDeps();

    await expectRejectsInstanceOf(
      pointConversionUseCase.create({
        name: `${prefix}_invalid_rule`,
        fromPointTypeId: pointType.id,
        toPointTypeId: pointType.id,
        fromAmount: 1,
        toAmount: 1,
      }),
      PointConversionRuleInvalidError,
    );
  });

  it('积分转换会拒绝非正数转换数量', async () => {
    const prefix = newBatch();
    const { pointConversionUseCase } = createDeps();
    const { rule, user } = await seedConversionFixture(`${prefix}_non_positive`);

    await expectRejectsInstanceOf(
      pointConversionUseCase.convert({
        userId: user.id,
        ruleId: rule.id,
        fromAmount: 0,
        nonce: `${prefix}_zero`,
      }),
      PointConversionRuleInvalidError,
    );
  });

  it('积分转换会拒绝非规则倍数的转换数量', async () => {
    const prefix = newBatch();
    const { pointConversionUseCase } = createDeps();
    const { rule, user } = await seedConversionFixture(`${prefix}_non_multiple`, {
      fromAmount: 3,
      toAmount: 10,
    });

    await expectRejectsInstanceOf(
      pointConversionUseCase.convert({
        userId: user.id,
        ruleId: rule.id,
        fromAmount: 4,
        nonce: `${prefix}_non_multiple`,
      }),
      PointConversionRuleInvalidError,
    );
  });

  it('积分转换会校验单次最小和最大转换数量', async () => {
    const prefix = newBatch();
    const { pointConversionUseCase } = createDeps();
    const { rule, user } = await seedConversionFixture(`${prefix}_min_max`, {
      fromAmount: 2,
      toAmount: 10,
      minFromAmount: 4,
      maxFromAmount: 8,
    });

    await expectRejectsInstanceOf(
      pointConversionUseCase.convert({
        userId: user.id,
        ruleId: rule.id,
        fromAmount: 2,
        nonce: `${prefix}_below_min`,
      }),
      PointConversionRuleInvalidError,
    );

    await expectRejectsInstanceOf(
      pointConversionUseCase.convert({
        userId: user.id,
        ruleId: rule.id,
        fromAmount: 10,
        nonce: `${prefix}_above_max`,
      }),
      PointConversionRuleInvalidError,
    );
  });

  it('积分转换会拒绝停用、未开始和已过期的规则', async () => {
    const prefix = newBatch();
    const { pointConversionUseCase } = createDeps();
    const disabled = await seedConversionFixture(`${prefix}_disabled`, {
      enabled: false,
    });
    const future = await seedConversionFixture(`${prefix}_future`, {
      startsAt: new Date(Date.now() + 60_000),
    });
    const expired = await seedConversionFixture(`${prefix}_expired`, {
      startsAt: new Date(Date.now() - 120_000),
      endsAt: new Date(Date.now() - 60_000),
    });

    await expectRejectsInstanceOf(
      pointConversionUseCase.convert({
        userId: disabled.user.id,
        ruleId: disabled.rule.id,
        fromAmount: 2,
        nonce: `${prefix}_disabled`,
      }),
      PointConversionRuleUnavailableError,
    );

    await expectRejectsInstanceOf(
      pointConversionUseCase.convert({
        userId: future.user.id,
        ruleId: future.rule.id,
        fromAmount: 2,
        nonce: `${prefix}_future`,
      }),
      PointConversionRuleUnavailableError,
    );

    await expectRejectsInstanceOf(
      pointConversionUseCase.convert({
        userId: expired.user.id,
        ruleId: expired.rule.id,
        fromAmount: 2,
        nonce: `${prefix}_expired`,
      }),
      PointConversionRuleUnavailableError,
    );
  });

  it('积分转换重复提交不会重复扣加或重复流水', async () => {
    const prefix = newBatch();
    const fromPointType = await seedPointType(`${prefix}_dup_from_point`);
    const toPointType = await seedPointType(`${prefix}_dup_to_point`);
    const user = await seedUser(`${prefix}_dup_conversion_user`);
    const { pointConversionUseCase } = createDeps();
    const rule = await createConversionRule(`${prefix}_dup`, fromPointType.id, toPointType.id);

    await grantPoints({
      adminId: `${prefix}_admin`,
      userId: user.id,
      pointTypeId: fromPointType.id,
      delta: 5,
      nonce: `${prefix}_grant_from`,
    });

    const results = await runConcurrent(5, () =>
      pointConversionUseCase.convert({
        userId: user.id,
        ruleId: rule.id,
        fromAmount: 1,
        nonce: `${prefix}_same_nonce`,
      }),
    );

    const fromAccount = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: fromPointType.id },
    });
    const toAccount = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: toPointType.id },
    });
    const [consumeRows] = await db
      .select({ total: count() })
      .from(pointTransactions)
      .where(
        eq(
          pointTransactions.idempotencyKey,
          `point:conversion:${rule.id}:${prefix}_same_nonce:consume`,
        ),
      );
    const [grantRows] = await db
      .select({ total: count() })
      .from(pointTransactions)
      .where(
        eq(
          pointTransactions.idempotencyKey,
          `point:conversion:${rule.id}:${prefix}_same_nonce:grant`,
        ),
      );

    expect(countFulfilled(results)).toBe(1);
    expect(countRejected(results)).toBe(4);
    expect(fromAccount?.balance).toBe(4);
    expect(toAccount?.balance).toBe(10);
    expect(consumeRows?.total).toBe(1);
    expect(grantRows?.total).toBe(1);
  });

  it('积分转换目标账户失败时会回滚来源扣减', async () => {
    const prefix = newBatch();
    const fromPointType = await seedPointType(`${prefix}_rollback_from_point`);
    const toPointType = await seedPointType(`${prefix}_rollback_to_point`);
    const user = await seedUser(`${prefix}_rollback_conversion_user`);
    const { pointAccountUseCase, pointConversionUseCase } = createDeps();
    const rule = await createConversionRule(`${prefix}_rollback`, fromPointType.id, toPointType.id);

    await grantPoints({
      adminId: `${prefix}_admin`,
      userId: user.id,
      pointTypeId: fromPointType.id,
      delta: 3,
      nonce: `${prefix}_grant_from`,
    });

    await pointAccountUseCase.adjustBalance(`${prefix}_admin`, {
      userId: user.id,
      pointTypeId: toPointType.id,
      delta: 1,
      nonce: `${prefix}_ensure_to`,
    });
    await pointAccountUseCase.adjustBalance(`${prefix}_admin`, {
      userId: user.id,
      pointTypeId: toPointType.id,
      delta: -1,
      nonce: `${prefix}_reset_to`,
    });

    await db
      .update(pointAccounts)
      .set({ status: 'banned' })
      .where(and(eq(pointAccounts.userId, user.id), eq(pointAccounts.pointTypeId, toPointType.id)));

    await expectRejectsInstanceOf(
      pointConversionUseCase.convert({
        userId: user.id,
        ruleId: rule.id,
        fromAmount: 1,
        nonce: `${prefix}_rollback`,
      }),
      PointAccountBannedError,
    );

    const fromAccount = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: fromPointType.id },
    });
    const toAccount = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: toPointType.id },
    });
    const [conversionRows] = await db
      .select({ total: count() })
      .from(pointTransactions)
      .where(eq(pointTransactions.sourceId, `${rule.id}:${prefix}_rollback`));

    expect(fromAccount?.balance).toBe(3);
    expect(toAccount?.balance).toBe(0);
    expect(conversionRows?.total).toBe(0);
  });
});
