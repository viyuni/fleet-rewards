import { expect, it } from 'bun:test';

import { orders, pointTransactions, productStockMovements } from '@server/db/schema';
import { and, count, eq } from 'drizzle-orm';

import {
  countFulfilled,
  countRejected,
  runConcurrent,
} from '../../../__tests__/helpers/concurrency';
import { expectSeeded } from './concurrency-test-utils';
import {
  createDeps,
  db,
  describeWithDatabase,
  grantPoints,
  installConcurrencyTestHooks,
  newBatch,
  seedPointType,
  seedProduct,
  seedUser,
} from './concurrency-test-utils';

installConcurrencyTestHooks();

describeWithDatabase('订单真实数据库并发保护', () => {
  it('订单创建不会并发超扣库存或积分', async () => {
    const prefix = newBatch();
    const pointType = await seedPointType(`${prefix}_order_point`);
    const user = await seedUser(`${prefix}_order_user`);
    const product = await seedProduct({
      name: `${prefix}_order_product`,
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
      nonce: `${prefix}_grant_order_points`,
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
    const product = await seedProduct({
      name: `${prefix}_order_dup_product`,
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
      nonce: `${prefix}_grant_order_dup_points`,
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
      .where(eq(orders.idempotencyKey, `order:create:${prefix}_same_nonce`));
    const [consumeRows] = await db
      .select({ total: count() })
      .from(pointTransactions)
      .where(eq(pointTransactions.idempotencyKey, `order:${fulfilledOrder.id}:points:consume`));
    const [stockRows] = await db
      .select({ total: count() })
      .from(productStockMovements)
      .where(eq(productStockMovements.idempotencyKey, `order:${fulfilledOrder.id}:stock:consume`));

    expect(countFulfilled(results)).toBe(1);
    expect(countRejected(results)).toBe(4);
    expect(currentProduct?.stock).toBe(4);
    expect(account?.balance).toBe(4);
    expect(orderRows?.total).toBe(1);
    expect(consumeRows?.total).toBe(1);
    expect(stockRows?.total).toBe(1);
  });
});
