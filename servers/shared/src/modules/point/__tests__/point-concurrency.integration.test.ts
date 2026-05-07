import { afterAll, afterEach, beforeAll, describe, expect, it } from 'bun:test';

import { createDatabase, type DbClient } from '@server/db';
import {
  pointAccounts,
  pointConversionRules,
  pointTransactions,
  pointTypes,
  productStockMovements,
  products,
  orders,
  users,
} from '@server/db/schema';
import { and, count, eq, inArray, like } from 'drizzle-orm';

import {
  PointAccountRepository,
  PointBalanceUseCase,
  PointConversionRuleInvalidError,
  PointConversionRuleUnavailableError,
  PointConversionRuleRepository,
  PointConversionUseCase,
  POINT_CHANGE_SOURCE_TYPE,
  PointTypeRepository,
  PointTypeUseCase,
} from '..';
import {
  countFulfilled,
  countRejected,
  runConcurrent,
} from '../../../__tests__/helpers/concurrency';
import { OrderRepository, OrderUseCase } from '../../order';
import { ProductRepository, ProductUseCase, StockMovementRepository } from '../../product';
import { STOCK_MOVEMENT_SOURCE_TYPE } from '../../product/usecase/types';
import { UserBasicInfoCrypto, UserRepository, UserUseCase } from '../../user';

const testDatabaseUrl = Bun.env.DATABASE_URL;
const describeWithDatabase = testDatabaseUrl ? describe : describe.skip;

let db: DbClient;
let batch = '';

beforeAll(() => {
  if (!testDatabaseUrl) return;
  db = createDatabase(testDatabaseUrl);
});

afterAll(async () => {
  db.$client.end();
});

afterEach(async () => {
  if (!db || !batch) return;

  const batchUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(like(users.username, `${batch}%`));
  const userIds = batchUsers.map(user => user.id);

  const batchPointTypes = await db
    .select({ id: pointTypes.id })
    .from(pointTypes)
    .where(like(pointTypes.name, `${batch}%`));
  const pointTypeIds = batchPointTypes.map(pointType => pointType.id);

  const batchProducts = await db
    .select({ id: products.id })
    .from(products)
    .where(like(products.name, `${batch}%`));
  const productIds = batchProducts.map(product => product.id);

  if (userIds.length > 0) {
    await db.delete(orders).where(inArray(orders.userId, userIds));
  }

  if (productIds.length > 0) {
    await db
      .delete(productStockMovements)
      .where(inArray(productStockMovements.productId, productIds));
  }

  if (userIds.length > 0) {
    await db.delete(pointTransactions).where(inArray(pointTransactions.userId, userIds));
    await db.delete(pointAccounts).where(inArray(pointAccounts.userId, userIds));
    await db.delete(users).where(inArray(users.id, userIds));
  }

  if (pointTypeIds.length > 0) {
    await db
      .delete(pointConversionRules)
      .where(
        and(
          inArray(pointConversionRules.fromPointTypeId, pointTypeIds),
          inArray(pointConversionRules.toPointTypeId, pointTypeIds),
        ),
      );
  }

  if (productIds.length > 0) {
    await db.delete(products).where(inArray(products.id, productIds));
  }

  if (pointTypeIds.length > 0) {
    await db.delete(pointTypes).where(inArray(pointTypes.id, pointTypeIds));
  }
});

function newBatch() {
  batch = `shared_concurrency_${crypto.randomUUID().slice(0, 8)}`;
  return batch;
}

function createDeps() {
  const userRepo = new UserRepository(db);
  const pointTypeRepo = new PointTypeRepository(db);
  const pointAccountRepo = new PointAccountRepository();
  const pointConversionRuleRepo = new PointConversionRuleRepository(db);
  const productRepo = new ProductRepository(db);
  const stockMovementRepo = new StockMovementRepository(db);
  const orderRepo = new OrderRepository(db);
  const userUseCase = new UserUseCase({
    userBasicInfoCrypto: new UserBasicInfoCrypto('test'),
    userRepo,
  });
  const pointTypeUseCase = new PointTypeUseCase({ pointTypeRepo });
  const pointBalanceUseCase = new PointBalanceUseCase({
    pointAccountRepo,
    pointTypeUseCase,
    userUseCase,
  });
  const productUseCase = new ProductUseCase({
    db,
    pointTypeUseCase,
    productRepo,
    stockMovementRepo,
  });
  const pointConversionUseCase = new PointConversionUseCase({
    db,
    pointAccountRepo,
    pointBalanceUseCase,
    pointConversionRuleRepo,
    pointTypeUseCase,
  });
  const orderUseCase = new OrderUseCase({
    db,
    orderRepo,
    pointAccountRepo,
    pointBalanceUseCase,
    pointTypeUseCase,
    productUseCase,
    userUseCase,
  });

  return {
    orderUseCase,
    pointAccountRepo,
    pointBalanceUseCase,
    pointConversionUseCase,
    productUseCase,
  };
}

async function seedPointType(name: string) {
  const [pointType] = await db
    .insert(pointTypes)
    .values({
      name,
      status: 'active',
    })
    .returning();

  if (!pointType) throw new Error('seed point type failed');
  return pointType;
}

async function seedUser(name: string) {
  const [user] = await db
    .insert(users)
    .values({
      biliUid: `${name}_bili`,
      username: name,
      passwordHash: 'test',
      status: 'normal',
    })
    .returning();

  if (!user) throw new Error('seed user failed');
  return user;
}

async function seedConversionFixture(
  prefix: string,
  overrides: Partial<typeof pointConversionRules.$inferInsert> = {},
) {
  const fromPointType = await seedPointType(`${prefix}_from_point`);
  const toPointType = await seedPointType(`${prefix}_to_point`);
  const user = await seedUser(`${prefix}_conversion_user`);
  const [rule] = await db
    .insert(pointConversionRules)
    .values({
      name: `${prefix}_conversion_rule`,
      fromPointTypeId: fromPointType.id,
      toPointTypeId: toPointType.id,
      fromAmount: 2,
      toAmount: 10,
      enabled: true,
      ...overrides,
    })
    .returning();

  if (!rule) throw new Error('seed conversion rule failed');

  return {
    fromPointType,
    rule,
    toPointType,
    user,
  };
}

describeWithDatabase('shared 真实数据库并发保护', () => {
  it('库存模块不会并发超扣', async () => {
    const prefix = newBatch();
    const pointType = await seedPointType(`${prefix}_stock_point`);
    const [product] = await db
      .insert(products)
      .values({
        name: `${prefix}_product`,
        pointTypeId: pointType.id,
        price: 1,
        stock: 3,
        status: 'active',
      })
      .returning();

    if (!product) throw new Error('seed product failed');

    const { productUseCase } = createDeps();
    const results = await runConcurrent(10, index =>
      db.transaction(async tx => {
        const lockedProduct = await productUseCase.requireByIdForUpdate(tx, product.id);

        return await productUseCase.changeStock(tx, lockedProduct, {
          type: 'consume',
          productId: product.id,
          delta: -1,
          sourceType: STOCK_MOVEMENT_SOURCE_TYPE.consume,
          sourceId: `${prefix}_stock_${index}`,
          idempotencyKey: `${prefix}_stock_${index}`,
        });
      }),
    );

    const current = await db.query.products.findFirst({ where: { id: product.id } });

    expect(countFulfilled(results)).toBe(3);
    expect(countRejected(results)).toBe(7);
    expect(current?.stock).toBe(0);
  });

  it('积分账户不会并发超扣', async () => {
    const prefix = newBatch();
    const pointType = await seedPointType(`${prefix}_balance_point`);
    const user = await seedUser(`${prefix}_user`);
    const { pointAccountRepo, pointBalanceUseCase } = createDeps();

    await db.transaction(async tx => {
      const account = await pointAccountRepo.ensureAccountAndLock(tx, {
        userId: user.id,
        pointTypeId: pointType.id,
      });

      await pointBalanceUseCase.changeBalance(tx, account, {
        type: 'grant',
        userId: user.id,
        pointTypeId: pointType.id,
        delta: 3,
        sourceType: POINT_CHANGE_SOURCE_TYPE.AdminAdjustment,
        sourceId: `${prefix}_grant`,
        idempotencyKey: `${prefix}_grant`,
      });
    });

    const account = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: pointType.id },
    });

    if (!account) throw new Error('seed account failed');

    const results = await runConcurrent(10, index =>
      db.transaction(async tx => {
        const lockedAccount = await pointAccountRepo.requireByIdForUpdate(tx, account.id);

        return await pointBalanceUseCase.changeBalance(tx, lockedAccount, {
          type: 'consume',
          userId: user.id,
          pointTypeId: pointType.id,
          delta: -1,
          sourceType: POINT_CHANGE_SOURCE_TYPE.OrderConsume,
          sourceId: `${prefix}_consume_${index}`,
          idempotencyKey: `${prefix}_consume_${index}`,
        });
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
    const { pointAccountRepo, pointBalanceUseCase } = createDeps();

    const results = await runConcurrent(5, () =>
      db.transaction(async tx => {
        const account = await pointAccountRepo.ensureAccountAndLock(tx, {
          userId: user.id,
          pointTypeId: pointType.id,
        });

        return await pointBalanceUseCase.changeBalance(tx, account, {
          type: 'grant',
          userId: user.id,
          pointTypeId: pointType.id,
          delta: 1,
          sourceType: POINT_CHANGE_SOURCE_TYPE.AdminAdjustment,
          sourceId: `${prefix}_same_source`,
          idempotencyKey: `${prefix}_same_key`,
        });
      }),
    );

    const [row] = await db
      .select({ total: count() })
      .from(pointTransactions)
      .where(eq(pointTransactions.idempotencyKey, `${prefix}_same_key`));
    const account = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: pointType.id },
    });

    expect(countFulfilled(results)).toBe(1);
    expect(countRejected(results)).toBe(4);
    expect(row?.total).toBe(1);
    expect(account?.balance).toBe(1);
  });

  it('库存变动记录保持唯一', async () => {
    const prefix = newBatch();
    const pointType = await seedPointType(`${prefix}_movement_unique_point`);
    const [product] = await db
      .insert(products)
      .values({
        name: `${prefix}_movement_product`,
        pointTypeId: pointType.id,
        price: 1,
        stock: 0,
        status: 'active',
      })
      .returning();

    if (!product) throw new Error('seed product failed');

    const { productUseCase } = createDeps();
    const results = await runConcurrent(5, () =>
      db.transaction(async tx => {
        const lockedProduct = await productUseCase.requireByIdForUpdate(tx, product.id);

        return await productUseCase.changeStock(tx, lockedProduct, {
          type: 'adjust',
          productId: product.id,
          delta: 1,
          sourceType: STOCK_MOVEMENT_SOURCE_TYPE.adjust,
          sourceId: `${prefix}_same_source`,
          idempotencyKey: `${prefix}_same_key`,
        });
      }),
    );

    const [row] = await db
      .select({ total: count() })
      .from(productStockMovements)
      .where(eq(productStockMovements.idempotencyKey, `${prefix}_same_key`));
    const current = await db.query.products.findFirst({ where: { id: product.id } });

    expect(countFulfilled(results)).toBe(1);
    expect(countRejected(results)).toBe(4);
    expect(row?.total).toBe(1);
    expect(current?.stock).toBe(1);
  });

  it('积分转换不会并发超扣', async () => {
    const prefix = newBatch();
    const fromPointType = await seedPointType(`${prefix}_from_point`);
    const toPointType = await seedPointType(`${prefix}_to_point`);
    const user = await seedUser(`${prefix}_conversion_user`);
    const { pointAccountRepo, pointBalanceUseCase, pointConversionUseCase } = createDeps();
    const [rule] = await db
      .insert(pointConversionRules)
      .values({
        name: `${prefix}_conversion_rule`,
        fromPointTypeId: fromPointType.id,
        toPointTypeId: toPointType.id,
        fromAmount: 1,
        toAmount: 10,
        enabled: true,
      })
      .returning();

    if (!rule) throw new Error('seed conversion rule failed');

    await db.transaction(async tx => {
      const account = await pointAccountRepo.ensureAccountAndLock(tx, {
        userId: user.id,
        pointTypeId: fromPointType.id,
      });

      await pointBalanceUseCase.changeBalance(tx, account, {
        type: 'grant',
        userId: user.id,
        pointTypeId: fromPointType.id,
        delta: 3,
        sourceType: POINT_CHANGE_SOURCE_TYPE.AdminAdjustment,
        sourceId: `${prefix}_grant_from`,
        idempotencyKey: `${prefix}_grant_from`,
      });
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

    await expect(
      pointConversionUseCase.create({
        name: `${prefix}_invalid_rule`,
        fromPointTypeId: pointType.id,
        toPointTypeId: pointType.id,
        fromAmount: 1,
        toAmount: 1,
      }),
    ).rejects.toBeInstanceOf(PointConversionRuleInvalidError);
  });

  it('积分转换会拒绝非正数转换数量', async () => {
    const prefix = newBatch();
    const { pointConversionUseCase } = createDeps();
    const { rule, user } = await seedConversionFixture(`${prefix}_non_positive`);

    await expect(
      pointConversionUseCase.convert({
        userId: user.id,
        ruleId: rule.id,
        fromAmount: 0,
        nonce: `${prefix}_zero`,
      }),
    ).rejects.toBeInstanceOf(PointConversionRuleInvalidError);
  });

  it('积分转换会拒绝非规则倍数的转换数量', async () => {
    const prefix = newBatch();
    const { pointConversionUseCase } = createDeps();
    const { rule, user } = await seedConversionFixture(`${prefix}_non_multiple`, {
      fromAmount: 3,
      toAmount: 10,
    });

    await expect(
      pointConversionUseCase.convert({
        userId: user.id,
        ruleId: rule.id,
        fromAmount: 4,
        nonce: `${prefix}_non_multiple`,
      }),
    ).rejects.toBeInstanceOf(PointConversionRuleInvalidError);
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

    await expect(
      pointConversionUseCase.convert({
        userId: user.id,
        ruleId: rule.id,
        fromAmount: 2,
        nonce: `${prefix}_below_min`,
      }),
    ).rejects.toBeInstanceOf(PointConversionRuleInvalidError);

    await expect(
      pointConversionUseCase.convert({
        userId: user.id,
        ruleId: rule.id,
        fromAmount: 10,
        nonce: `${prefix}_above_max`,
      }),
    ).rejects.toBeInstanceOf(PointConversionRuleInvalidError);
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

    await expect(
      pointConversionUseCase.convert({
        userId: disabled.user.id,
        ruleId: disabled.rule.id,
        fromAmount: 2,
        nonce: `${prefix}_disabled`,
      }),
    ).rejects.toBeInstanceOf(PointConversionRuleUnavailableError);

    await expect(
      pointConversionUseCase.convert({
        userId: future.user.id,
        ruleId: future.rule.id,
        fromAmount: 2,
        nonce: `${prefix}_future`,
      }),
    ).rejects.toBeInstanceOf(PointConversionRuleUnavailableError);

    await expect(
      pointConversionUseCase.convert({
        userId: expired.user.id,
        ruleId: expired.rule.id,
        fromAmount: 2,
        nonce: `${prefix}_expired`,
      }),
    ).rejects.toBeInstanceOf(PointConversionRuleUnavailableError);
  });

  it('积分转换重复提交不会重复扣加或重复流水', async () => {
    const prefix = newBatch();
    const fromPointType = await seedPointType(`${prefix}_dup_from_point`);
    const toPointType = await seedPointType(`${prefix}_dup_to_point`);
    const user = await seedUser(`${prefix}_dup_conversion_user`);
    const { pointAccountRepo, pointBalanceUseCase, pointConversionUseCase } = createDeps();
    const [rule] = await db
      .insert(pointConversionRules)
      .values({
        name: `${prefix}_dup_conversion_rule`,
        fromPointTypeId: fromPointType.id,
        toPointTypeId: toPointType.id,
        fromAmount: 1,
        toAmount: 10,
        enabled: true,
      })
      .returning();

    if (!rule) throw new Error('seed conversion rule failed');

    await db.transaction(async tx => {
      const account = await pointAccountRepo.ensureAccountAndLock(tx, {
        userId: user.id,
        pointTypeId: fromPointType.id,
      });

      await pointBalanceUseCase.changeBalance(tx, account, {
        type: 'grant',
        userId: user.id,
        pointTypeId: fromPointType.id,
        delta: 5,
        sourceType: POINT_CHANGE_SOURCE_TYPE.AdminAdjustment,
        sourceId: `${prefix}_grant_from`,
        idempotencyKey: `${prefix}_grant_from`,
      });
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

  it.skip('积分转换目标账户失败时会回滚来源扣减', async () => {
    const prefix = newBatch();
    const fromPointType = await seedPointType(`${prefix}_rollback_from_point`);
    const toPointType = await seedPointType(`${prefix}_rollback_to_point`);
    const user = await seedUser(`${prefix}_rollback_conversion_user`);
    const { pointAccountRepo, pointBalanceUseCase, pointConversionUseCase } = createDeps();
    const [rule] = await db
      .insert(pointConversionRules)
      .values({
        name: `${prefix}_rollback_conversion_rule`,
        fromPointTypeId: fromPointType.id,
        toPointTypeId: toPointType.id,
        fromAmount: 1,
        toAmount: 10,
        enabled: true,
      })
      .returning();

    if (!rule) throw new Error('seed conversion rule failed');

    await db.transaction(async tx => {
      const fromAccount = await pointAccountRepo.ensureAccountAndLock(tx, {
        userId: user.id,
        pointTypeId: fromPointType.id,
      });

      await pointAccountRepo.ensureAccountAndLock(tx, {
        userId: user.id,
        pointTypeId: toPointType.id,
      });

      await pointBalanceUseCase.changeBalance(tx, fromAccount, {
        type: 'grant',
        userId: user.id,
        pointTypeId: fromPointType.id,
        delta: 3,
        sourceType: POINT_CHANGE_SOURCE_TYPE.AdminAdjustment,
        sourceId: `${prefix}_grant_from`,
        idempotencyKey: `${prefix}_grant_from`,
      });
    });

    await db
      .update(pointAccounts)
      .set({ status: 'banned' })
      .where(and(eq(pointAccounts.userId, user.id), eq(pointAccounts.pointTypeId, toPointType.id)));

    await expect(
      pointConversionUseCase.convert({
        userId: user.id,
        ruleId: rule.id,
        fromAmount: 1,
        nonce: `${prefix}_rollback`,
      }),
    ).rejects.toThrow();

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

  it('订单创建不会并发超扣库存或积分', async () => {
    const prefix = newBatch();
    const pointType = await seedPointType(`${prefix}_order_point`);
    const user = await seedUser(`${prefix}_order_user`);
    const [product] = await db
      .insert(products)
      .values({
        name: `${prefix}_order_product`,
        pointTypeId: pointType.id,
        price: 1,
        stock: 3,
        status: 'active',
      })
      .returning();

    if (!product) throw new Error('seed product failed');

    const { orderUseCase, pointAccountRepo, pointBalanceUseCase } = createDeps();

    await db.transaction(async tx => {
      const account = await pointAccountRepo.ensureAccountAndLock(tx, {
        userId: user.id,
        pointTypeId: pointType.id,
      });

      await pointBalanceUseCase.changeBalance(tx, account, {
        type: 'grant',
        userId: user.id,
        pointTypeId: pointType.id,
        delta: 3,
        sourceType: POINT_CHANGE_SOURCE_TYPE.AdminAdjustment,
        sourceId: `${prefix}_grant_order_points`,
        idempotencyKey: `${prefix}_grant_order_points`,
      });
    });

    const results = await runConcurrent(10, index =>
      orderUseCase.create(user.id, {
        productId: product.id,
        nonce: `${prefix}_${index}`,
      }),
    );

    const currentProduct = await db.query.products.findFirst({ where: { id: product.id } });
    const account = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: pointType.id },
    });
    const [orderRows] = await db
      .select({ total: count() })
      .from(orders)
      .where(and(eq(orders.userId, user.id), eq(orders.productId, product.id)));

    expect(countFulfilled(results)).toBe(3);
    expect(countRejected(results)).toBe(7);
    expect(currentProduct?.stock).toBe(0);
    expect(account?.balance).toBe(0);
    expect(orderRows?.total).toBe(3);
  });

  it('订单创建相同 nonce 不会重复创建或重复扣减', async () => {
    const prefix = newBatch();
    const pointType = await seedPointType(`${prefix}_order_dup_point`);
    const user = await seedUser(`${prefix}_order_dup_user`);
    const [product] = await db
      .insert(products)
      .values({
        name: `${prefix}_order_dup_product`,
        pointTypeId: pointType.id,
        price: 1,
        stock: 5,
        status: 'active',
      })
      .returning();

    if (!product) throw new Error('seed product failed');

    const { orderUseCase, pointAccountRepo, pointBalanceUseCase } = createDeps();

    await db.transaction(async tx => {
      const account = await pointAccountRepo.ensureAccountAndLock(tx, {
        userId: user.id,
        pointTypeId: pointType.id,
      });

      await pointBalanceUseCase.changeBalance(tx, account, {
        type: 'grant',
        userId: user.id,
        pointTypeId: pointType.id,
        delta: 5,
        sourceType: POINT_CHANGE_SOURCE_TYPE.AdminAdjustment,
        sourceId: `${prefix}_grant_order_dup_points`,
        idempotencyKey: `${prefix}_grant_order_dup_points`,
      });
    });

    const results = await runConcurrent(5, () =>
      orderUseCase.create(user.id, {
        productId: product.id,
        nonce: `${prefix}_same_nonce`,
      }),
    );

    const currentProduct = await db.query.products.findFirst({ where: { id: product.id } });
    const account = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: pointType.id },
    });
    const [orderRows] = await db
      .select({ total: count() })
      .from(orders)
      .where(eq(orders.idempotencyKey, `order:create:${prefix}_same_nonce`));
    const [consumeRows] = await db
      .select({ total: count() })
      .from(pointTransactions)
      .where(eq(pointTransactions.sourceType, POINT_CHANGE_SOURCE_TYPE.OrderConsume));
    const [stockRows] = await db
      .select({ total: count() })
      .from(productStockMovements)
      .where(
        eq(
          productStockMovements.idempotencyKey,
          `order:${results.find(result => result.status === 'fulfilled')?.value.id}:stock:consume`,
        ),
      );

    expect(countFulfilled(results)).toBe(1);
    expect(countRejected(results)).toBe(4);
    expect(currentProduct?.stock).toBe(4);
    expect(account?.balance).toBe(4);
    expect(orderRows?.total).toBe(1);
    expect(consumeRows?.total).toBeGreaterThanOrEqual(1);
    expect(stockRows?.total).toBe(1);
  });
});
