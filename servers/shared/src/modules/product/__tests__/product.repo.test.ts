import { afterAll, describe, expect, it } from 'bun:test';

import { createDatabase, type DbTransaction } from '@server/db';
import { pointTypes, products } from '@server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { Pool } from 'pg';

import { StockInsufficientError } from '../domain';
import { ProductRepository } from '../repository';

const testDatabaseUrl = Bun.env.TEST_DATABASE_URL;
const describeWithDatabase = testDatabaseUrl ? describe : describe.skip;
const rollback = Symbol('rollback');
const pool = testDatabaseUrl ? new Pool({ connectionString: testDatabaseUrl }) : undefined;
const db = testDatabaseUrl ? createDatabase(testDatabaseUrl) : undefined;
type DecreaseStockResult = Awaited<ReturnType<typeof ProductRepository.decreaseStock>>;

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

async function createPointType(tx: DbTransaction) {
  const id = crypto.randomUUID();
  const [pointType] = await tx
    .insert(pointTypes)
    .values({
      id,
      name: `商品仓储积分 ${id}`,
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
    stock?: number;
  },
) {
  const id = crypto.randomUUID();
  const [product] = await tx
    .insert(products)
    .values({
      id,
      name: `商品仓储 ${id}`,
      pointTypeId: input.pointTypeId,
      price: 100,
      stock: input.stock ?? 0,
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

describeWithDatabase('商品 Repository', () => {
  it('库存不足时扣减失败且库存不变', async () => {
    await withRollback(async tx => {
      const pointType = await createPointType(tx);
      const product = await createProduct(tx, {
        pointTypeId: pointType.id,
        stock: 1,
      });

      await expectRejectsWith(
        ProductRepository.decreaseStock(tx, {
          productId: product.id,
          amount: 2,
        }),
        StockInsufficientError,
      );

      const [persistedProduct] = await tx
        .select()
        .from(products)
        .where(eq(products.id, product.id));

      expect(persistedProduct?.stock).toBe(1);
    });
  });

  it('并发扣减同一件库存时条件更新阻止超扣', async () => {
    if (!db) {
      throw new Error('TEST_DATABASE_URL 未配置');
    }

    const pointTypeId = crypto.randomUUID();
    const productId = crypto.randomUUID();

    await db.transaction(async tx => {
      await tx.insert(pointTypes).values({
        id: pointTypeId,
        name: `商品仓储并发积分 ${pointTypeId}`,
      });
      await tx.insert(products).values({
        id: productId,
        name: `仓储并发扣库存商品 ${productId}`,
        pointTypeId,
        price: 100,
        stock: 1,
      });
    });

    try {
      const results = await Promise.allSettled(
        [1, 2].map(() =>
          db.transaction(async tx => {
            await tx.execute(sql`set local lock_timeout = '1000ms'`);
            await tx.execute(sql`set local statement_timeout = '3000ms'`);

            return ProductRepository.decreaseStock(tx as DbTransaction, {
              productId,
              amount: 1,
            });
          }),
        ),
      );

      const fulfilled = results.filter(
        (result): result is PromiseFulfilledResult<DecreaseStockResult> =>
          result.status === 'fulfilled',
      );
      const rejected = results.filter(
        (result): result is PromiseRejectedResult => result.status === 'rejected',
      );
      const [persistedProduct] = await db.select().from(products).where(eq(products.id, productId));

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect(rejected[0]?.reason).toBeInstanceOf(StockInsufficientError);
      expect(fulfilled[0]?.value.stock).toBe(0);
      expect(persistedProduct?.stock).toBe(0);
    } finally {
      await db.delete(products).where(eq(products.id, productId));
      await db.delete(pointTypes).where(eq(pointTypes.id, pointTypeId));
    }
  });
});
