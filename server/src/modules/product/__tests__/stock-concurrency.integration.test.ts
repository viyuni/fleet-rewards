import { expect, it } from 'bun:test';

import { count, eq } from 'drizzle-orm';

import { productStockMovements } from '#db/schema';

import { StockIdempotencyKey } from '..';
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
  installConcurrencyTestHooks,
  newBatch,
  seedPointType,
  seedProduct,
} from '../../../__tests__/helpers/concurrency-fixtures';
import { ProductNameExistsError } from '../domain';

installConcurrencyTestHooks();

describeWithDatabase('产品库存真实数据库并发保护', () => {
  it('商品创建会拒绝重复名称', async () => {
    const prefix = newBatch('product_name');
    const pointType = await seedPointType(`${prefix}_point`);
    const { productUseCase } = createDeps();

    await productUseCase.create({
      name: `${prefix}_product`,
      pointTypeId: pointType.id,
      price: 1,
      stock: 1,
    });

    await expectRejectsInstanceOf(
      productUseCase.create({
        name: `${prefix}_product`,
        pointTypeId: pointType.id,
        price: 1,
        stock: 1,
      }),
      ProductNameExistsError,
    );
  });

  it('商品更新会拒绝重复名称', async () => {
    const prefix = newBatch('product_update_name');
    const pointType = await seedPointType(`${prefix}_point`);
    const first = await seedProduct({
      name: `${prefix}_first_product`,
      pointTypeId: pointType.id,
      price: 1,
      stock: 1,
    });
    const second = await seedProduct({
      name: `${prefix}_second_product`,
      pointTypeId: pointType.id,
      price: 1,
      stock: 1,
    });

    const { productUseCase } = createDeps();

    await expectRejectsInstanceOf(
      productUseCase.update(second.id, {
        name: first.name,
      }),
      ProductNameExistsError,
    );
  });

  it('商品更新保持原名称时允许保存', async () => {
    const prefix = newBatch('product_keep_name');
    const pointType = await seedPointType(`${prefix}_point`);
    const product = await seedProduct({
      name: `${prefix}_product`,
      pointTypeId: pointType.id,
      price: 1,
      stock: 1,
    });

    const { productUseCase } = createDeps();
    const updated = await productUseCase.update(product.id, {
      name: product.name,
      price: 2,
    });

    expect(updated.name).toBe(product.name);
    expect(updated.price).toBe(2);
  });

  it('商品删除后可复用名称', async () => {
    const prefix = newBatch('product_remove_name');
    const pointType = await seedPointType(`${prefix}_point`);
    const product = await seedProduct({
      name: `${prefix}_product`,
      pointTypeId: pointType.id,
      price: 1,
      stock: 1,
    });

    const { productUseCase } = createDeps();

    await productUseCase.remove(product.id);

    const recreated = await productUseCase.create({
      name: product.name,
      pointTypeId: pointType.id,
      price: 1,
      stock: 1,
    });
    const page = await productUseCase.pageManage({
      keyword: product.name,
      page: 1,
      pageSize: 10,
    });

    expect(recreated?.id).toBeDefined();
    expect(page.items.some(item => item.id === product.id)).toBe(false);
    expect(page.items.some(item => item.id === recreated?.id)).toBe(true);
  });

  it('库存扣减不会并发超扣', async () => {
    const prefix = newBatch('product_stock');
    const pointType = await seedPointType(`${prefix}_point`);
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
        nonce: `${prefix}_deduct_${index}`,
      }),
    );

    const current = await db.query.products.findFirst({ where: { id: product.id } });

    expect(countFulfilled(results)).toBe(3);
    expect(countRejected(results)).toBe(7);
    expect(current?.stock).toBe(0);
  });

  it('库存变动记录按幂等键保持唯一', async () => {
    const prefix = newBatch('product_movement');
    const pointType = await seedPointType(`${prefix}_point`);
    const product = await seedProduct({
      name: `${prefix}_product`,
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
          StockIdempotencyKey.adminAdjust({
            productId: product.id,
            adminId: `${prefix}_admin`,
            nonce: `${prefix}_same_key`,
          }),
        ),
      );
    const current = await db.query.products.findFirst({ where: { id: product.id } });

    expect(countFulfilled(results)).toBe(1);
    expect(countRejected(results)).toBe(4);
    expect(row?.total).toBe(1);
    expect(current?.stock).toBe(1);
  });
});
