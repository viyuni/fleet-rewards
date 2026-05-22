import { expect, it } from 'bun:test';

import { and, count, eq } from 'drizzle-orm';

import { orders, pointTransactions, productStockMovements } from '#db/schema';
import { OrderIdempotencyKey } from '#modules/order';
import { PointIdempotencyKey } from '#modules/point';
import { ProductUnavailableError, StockIdempotencyKey } from '#modules/product';

import {
  countFulfilled,
  countRejected,
  runConcurrent,
} from '../../../__tests__/helpers/concurrency';
import {
  createDeps,
  db,
  describeWithDatabase,
  expectRejectsInstanceOf,
  expectSeeded,
  grantPoints,
  installConcurrencyTestHooks,
  newBatch,
  seedPointType,
  seedProduct,
  seedUser,
} from '../../../__tests__/helpers/concurrency-fixtures';

installConcurrencyTestHooks();

describeWithDatabase('订单真实数据库并发保护', () => {
  it('订单创建不会并发超扣库存或积分', async () => {
    const prefix = newBatch('order_stock');
    const pointType = await seedPointType(`${prefix}_point`);
    const user = await seedUser(`${prefix}_user`);
    const product = await seedProduct({
      name: `${prefix}_product`,
      pointTypeId: pointType.id,
      price: 1,
      stock: 3,
    });

    const { orderUseCase } = createDeps();

    await grantPoints({
      adminId: `${prefix}_admin`,
      userId: user.id,
      pointTypeId: pointType.id,
      delta: 3,
      nonce: `${prefix}_grant_points`,
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
    const prefix = newBatch('order_idempotency');
    const pointType = await seedPointType(`${prefix}_point`);
    const user = await seedUser(`${prefix}_user`);
    const product = await seedProduct({
      name: `${prefix}_product`,
      pointTypeId: pointType.id,
      price: 1,
      stock: 5,
    });

    const { orderUseCase } = createDeps();

    await grantPoints({
      adminId: `${prefix}_admin`,
      userId: user.id,
      pointTypeId: pointType.id,
      delta: 5,
      nonce: `${prefix}_grant_points`,
    });

    const results = await runConcurrent(5, () =>
      orderUseCase.create(user.id, {
        productId: product.id,
        nonce: `${prefix}_same_nonce`,
      }),
    );
    const fulfilledOrder = expectSeeded(
      results.find(result => result.status === 'fulfilled')?.value,
      'order create failed',
    );

    const currentProduct = await db.query.products.findFirst({ where: { id: product.id } });
    const account = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: pointType.id },
    });
    const [orderRows] = await db
      .select({ total: count() })
      .from(orders)
      .where(
        eq(
          orders.idempotencyKey,
          OrderIdempotencyKey.create({
            nonce: `${prefix}_same_nonce`,
          }),
        ),
      );
    const [consumeRows] = await db
      .select({ total: count() })
      .from(pointTransactions)
      .where(
        eq(
          pointTransactions.idempotencyKey,
          PointIdempotencyKey.orderConsume({ orderId: fulfilledOrder.id }),
        ),
      );
    const [stockRows] = await db
      .select({ total: count() })
      .from(productStockMovements)
      .where(
        eq(
          productStockMovements.idempotencyKey,
          StockIdempotencyKey.orderConsume({ orderId: fulfilledOrder.id }),
        ),
      );

    expect(countFulfilled(results)).toBe(1);
    expect(countRejected(results)).toBe(4);
    expect(currentProduct?.stock).toBe(4);
    expect(account?.balance).toBe(4);
    expect(orderRows?.total).toBe(1);
    expect(consumeRows?.total).toBe(1);
    expect(stockRows?.total).toBe(1);
  });

  it('商品不在可兑换时间范围内时不允许创建订单', async () => {
    const prefix = newBatch('order_product_time_range');
    const pointType = await seedPointType(`${prefix}_point`);
    const user = await seedUser(`${prefix}_user`);
    const { orderUseCase } = createDeps();

    await grantPoints({
      adminId: `${prefix}_admin`,
      userId: user.id,
      pointTypeId: pointType.id,
      delta: 2,
      nonce: `${prefix}_grant_points`,
    });

    const futureProduct = await seedProduct({
      name: `${prefix}_future_product`,
      pointTypeId: pointType.id,
      price: 1,
      stock: 1,
      startAt: new Date(Date.now() + 60_000),
    });
    const expiredProduct = await seedProduct({
      name: `${prefix}_expired_product`,
      pointTypeId: pointType.id,
      price: 1,
      stock: 1,
      endAt: new Date(Date.now() - 60_000),
    });

    await expectRejectsInstanceOf(
      orderUseCase.create(user.id, {
        productId: futureProduct.id,
        nonce: `${prefix}_future_nonce`,
      }),
      ProductUnavailableError,
    );
    await expectRejectsInstanceOf(
      orderUseCase.create(user.id, {
        productId: expiredProduct.id,
        nonce: `${prefix}_expired_nonce`,
      }),
      ProductUnavailableError,
    );

    const [orderRows] = await db
      .select({ total: count() })
      .from(orders)
      .where(eq(orders.userId, user.id));

    expect(orderRows?.total).toBe(0);
  });
});
