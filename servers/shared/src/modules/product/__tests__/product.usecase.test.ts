import { afterAll, describe, expect, it } from 'bun:test';

import { createDatabase, type DbTransaction } from '@server/db';
import { pointTypes, productStockMovements, products } from '@server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { Pool } from 'pg';

import { PointTypeUnavailableError } from '../../point/domain';
import {
  InvalidStockMovementDeltaError,
  ProductInvalidInputError,
  ProductNotFoundError,
  ProductUnavailableError,
  StockInsufficientError,
} from '../domain';
import { ProductUseCase } from '../usecase';

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

async function createPointType(
  tx: DbTransaction,
  input: {
    status?: 'active' | 'disabled';
  } = {},
) {
  const id = crypto.randomUUID();
  const [pointType] = await tx
    .insert(pointTypes)
    .values({
      id,
      name: `商品用例积分 ${id}`,
      status: input.status ?? 'active',
    })
    .returning();

  if (!pointType) {
    throw new Error('测试积分类型创建失败');
  }

  return pointType;
}

async function createProduct(
  tx: DbTransaction,
  input: {
    pointTypeId: string;
    name?: string;
    stock?: number;
    sort?: number;
    status?: 'active' | 'disabled';
    createdAt?: Date;
  },
) {
  const id = crypto.randomUUID();
  const [product] = await tx
    .insert(products)
    .values({
      id,
      name: input.name ?? `商品用例 ${id}`,
      pointTypeId: input.pointTypeId,
      price: 100,
      stock: input.stock ?? 0,
      status: input.status ?? 'disabled',
      sort: input.sort ?? 0,
      createdAt: input.createdAt,
    })
    .returning();

  if (!product) {
    throw new Error('测试商品创建失败');
  }

  return product;
}

afterAll(async () => {
  await pool?.end();
});

describeWithDatabase('商品 UseCase', () => {
  it('创建商品成功', async () => {
    await withRollback(async tx => {
      const useCase = new ProductUseCase(tx);
      const pointType = await createPointType(tx);

      const product = await useCase.create({
        name: '用例创建商品',
        description: '商品创建测试',
        pointTypeId: pointType.id,
        price: 100,
        stock: 10,
        deliveryType: 'manual',
      });

      expect(product?.name).toBe('用例创建商品');
      expect(product?.pointTypeId).toBe(pointType.id);
      expect(product?.price).toBe(100);
      expect(product?.stock).toBe(10);
    });
  });

  it('积分类型不存在时创建失败', async () => {
    await withRollback(async tx => {
      const useCase = new ProductUseCase(tx);

      await expectRejectsWith(
        useCase.create({
          name: '不存在积分类型商品',
          pointTypeId: crypto.randomUUID(),
          price: 100,
        }),
        PointTypeUnavailableError,
      );
    });
  });

  it('积分类型禁用时创建失败', async () => {
    await withRollback(async tx => {
      const useCase = new ProductUseCase(tx);
      const pointType = await createPointType(tx, { status: 'disabled' });

      await expectRejectsWith(
        useCase.create({
          name: '禁用积分类型商品',
          pointTypeId: pointType.id,
          price: 100,
        }),
        PointTypeUnavailableError,
      );
    });
  });

  it('价格非法时创建失败', async () => {
    await withRollback(async tx => {
      const useCase = new ProductUseCase(tx);
      const pointType = await createPointType(tx);

      await expectRejectsWith(
        useCase.create({
          name: '非法价格商品',
          pointTypeId: pointType.id,
          price: 0,
        }),
        ProductInvalidInputError,
      );
    });
  });

  it('库存非法时创建失败', async () => {
    await withRollback(async tx => {
      const useCase = new ProductUseCase(tx);
      const pointType = await createPointType(tx);

      await expectRejectsWith(
        useCase.create({
          name: '非法库存商品',
          pointTypeId: pointType.id,
          price: 100,
          stock: -1,
        }),
        ProductInvalidInputError,
      );
    });
  });

  it('行锁查询商品成功', async () => {
    await withRollback(async tx => {
      const pointType = await createPointType(tx);
      const product = await createProduct(tx, {
        pointTypeId: pointType.id,
        status: 'active',
      });

      const lockedProduct = await ProductUseCase.requireByIdForUpdate(tx, product.id);

      expect(lockedProduct.id).toBe(product.id);
      expect(lockedProduct.status).toBe('active');
    });
  });

  it('行锁查询不存在商品失败', async () => {
    await withRollback(async tx => {
      await expectRejectsWith(
        ProductUseCase.requireByIdForUpdate(tx, crypto.randomUUID()),
        ProductNotFoundError,
      );
    });
  });

  it('行锁查询下架商品失败', async () => {
    await withRollback(async tx => {
      const pointType = await createPointType(tx);
      const product = await createProduct(tx, {
        pointTypeId: pointType.id,
        status: 'disabled',
      });

      await expectRejectsWith(
        ProductUseCase.requireByIdForUpdate(tx, product.id),
        ProductUnavailableError,
      );
    });
  });

  it('更改库存成功并写入库存流水', async () => {
    await withRollback(async tx => {
      const useCase = new ProductUseCase(tx);
      const pointType = await createPointType(tx);
      const product = await createProduct(tx, {
        pointTypeId: pointType.id,
        stock: 2,
        status: 'active',
      });

      const result = await useCase.changeStock(tx, product, {
        type: 'consume',
        productId: product.id,
        delta: -1,
        sourceType: 'reward_order',
        sourceId: `order:${crypto.randomUUID()}`,
        idempotencyKey: `product-change-stock:${crypto.randomUUID()}`,
      });

      expect(result.product.stock).toBe(1);
      expect(result.movement.productId).toBe(product.id);
      expect(result.movement.type).toBe('consume');
      expect(result.movement.delta).toBe(-1);
      expect(result.movement.stockBefore).toBe(2);
      expect(result.movement.stockAfter).toBe(1);
    });
  });

  it('库存流水类型和 delta 不匹配时失败', async () => {
    await withRollback(async tx => {
      const useCase = new ProductUseCase(tx);
      const pointType = await createPointType(tx);
      const product = await createProduct(tx, {
        pointTypeId: pointType.id,
        stock: 2,
        status: 'active',
      });

      await expectRejectsWith(
        useCase.changeStock(tx, product, {
          type: 'consume',
          productId: product.id,
          delta: 1,
          sourceType: 'reward_order',
          sourceId: `order:${crypto.randomUUID()}`,
          idempotencyKey: `product-invalid-delta:${crypto.randomUUID()}`,
        }),
        InvalidStockMovementDeltaError,
      );
    });
  });

  it('并发扣减同一件库存时只允许一笔成功且不超扣', async () => {
    if (!db) {
      throw new Error('TEST_DATABASE_URL 未配置');
    }

    const productId = crypto.randomUUID();
    const pointTypeId = crypto.randomUUID();
    const idempotencyKeys = [
      `product-concurrent:${crypto.randomUUID()}:1`,
      `product-concurrent:${crypto.randomUUID()}:2`,
    ];

    await db.transaction(async tx => {
      await tx.insert(pointTypes).values({
        id: pointTypeId,
        name: `商品并发积分 ${pointTypeId}`,
      });
      await tx.insert(products).values({
        id: productId,
        name: `并发扣库存商品 ${productId}`,
        pointTypeId,
        price: 100,
        stock: 1,
        status: 'active',
      });
    });

    try {
      const results = await Promise.allSettled(
        idempotencyKeys.map((idempotencyKey, index) =>
          db.transaction(async tx => {
            await tx.execute(sql`set local lock_timeout = '1000ms'`);
            await tx.execute(sql`set local statement_timeout = '3000ms'`);

            const useCase = new ProductUseCase(tx as DbTransaction);
            const product = await ProductUseCase.requireByIdForUpdate(
              tx as DbTransaction,
              productId,
            );

            await useCase.changeStock(tx as DbTransaction, product, {
              type: 'consume',
              productId,
              delta: -1,
              sourceType: 'reward_order',
              sourceId: `order:product-concurrent:${index}`,
              idempotencyKey,
            });
          }),
        ),
      );

      const fulfilled = results.filter(
        (result): result is PromiseFulfilledResult<void> => result.status === 'fulfilled',
      );
      const rejected = results.filter(
        (result): result is PromiseRejectedResult => result.status === 'rejected',
      );
      const [persistedProduct] = await db.select().from(products).where(eq(products.id, productId));
      const movements = await db
        .select()
        .from(productStockMovements)
        .where(eq(productStockMovements.productId, productId));

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect(rejected[0]?.reason).toBeInstanceOf(StockInsufficientError);
      expect(persistedProduct?.stock).toBe(0);
      expect(movements).toHaveLength(1);
      expect(movements[0]?.delta).toBe(-1);
      expect(movements[0]?.stockBefore).toBe(1);
      expect(movements[0]?.stockAfter).toBe(0);
      // @ts-ignore
      expect(idempotencyKeys).toContain(movements[0]?.idempotencyKey);
    } finally {
      await db.delete(productStockMovements).where(eq(productStockMovements.productId, productId));
      await db.delete(products).where(eq(products.id, productId));
      await db.delete(pointTypes).where(eq(pointTypes.id, pointTypeId));
    }
  });
});
