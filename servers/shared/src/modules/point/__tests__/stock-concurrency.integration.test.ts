import { expect, it } from 'bun:test';

import { productStockMovements } from '@server/db/schema';
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
  installConcurrencyTestHooks,
  newBatch,
  seedPointType,
  seedProduct,
} from './concurrency-test-utils';

installConcurrencyTestHooks();

describeWithDatabase('库存真实数据库并发保护', () => {
  it('库存模块不会并发超扣', async () => {
    const prefix = newBatch();
    const pointType = await seedPointType(`${prefix}_stock_point`);
    const product = await seedProduct({
      name: `${prefix}_product`,
      pointTypeId: pointType.id,
      price: 1,
      stock: 3,
    });

    const { productUseCase } = createDeps();
    const results = await runConcurrent(10, index =>
      productUseCase.adminAdjustStock(product.id, `${prefix}_admin_${index}`, {
        delta: -1,
        nonce: `${prefix}_stock_${index}`,
      }),
    );

    const current = await db.query.products.findFirst({ where: { id: product.id } });

    expect(countFulfilled(results)).toBe(3);
    expect(countRejected(results)).toBe(7);
    expect(current?.stock).toBe(0);
  });

  it('库存变动记录保持唯一', async () => {
    const prefix = newBatch();
    const pointType = await seedPointType(`${prefix}_movement_unique_point`);
    const product = await seedProduct({
      name: `${prefix}_movement_product`,
      pointTypeId: pointType.id,
      price: 1,
      stock: 0,
    });

    const { productUseCase } = createDeps();
    const results = await runConcurrent(5, () =>
      productUseCase.adminAdjustStock(product.id, `${prefix}_admin`, {
        delta: 1,
        nonce: `${prefix}_same_key`,
      }),
    );

    const [row] = await db
      .select({ total: count() })
      .from(productStockMovements)
      .where(
        eq(
          productStockMovements.idempotencyKey,
          `admin:stock:adjust:${product.id}:${prefix}_admin:${prefix}_same_key`,
        ),
      );
    const current = await db.query.products.findFirst({ where: { id: product.id } });

    expect(countFulfilled(results)).toBe(1);
    expect(countRejected(results)).toBe(4);
    expect(row?.total).toBe(1);
    expect(current?.stock).toBe(1);
  });
});
