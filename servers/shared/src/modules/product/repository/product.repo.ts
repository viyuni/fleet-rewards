import type { DbExecutor, DbTransaction } from '@server/db';
import { deletedAtIsNull, eqIfDefined, keywordLike, PageBuilder } from '@server/db/helper';
import {
  products,
  type InsertProduct,
  type ProductStatus,
  type UpdateProduct,
} from '@server/db/schema';
import { and, desc, eq, gte, sql } from 'drizzle-orm';

import { StockAmountPolicy, StockInsufficientError, StockUpdateFailedError } from '../domain';
import type { ProductPageFilter } from './types';

export class ProductRepository {
  constructor(private readonly db: DbExecutor) {}

  /**
   * 获取指定 ID 的商品
   */
  async findById(id: string) {
    return await this.db.query.products.findFirst({
      where: {
        id,
        deletedAt: {
          isNull: true,
        },
      },
    });
  }

  /**
   * 获取商品列表
   */
  pageBuilder(filter: ProductPageFilter) {
    return new PageBuilder(this.db, products)
      .where(
        and(
          deletedAtIsNull(products),
          eqIfDefined(products.status, filter.status),
          eqIfDefined(products.pointTypeId, filter.pointTypeId),
          eqIfDefined(products.deliveryType, filter.deliveryType),
          keywordLike([products.name, products.description], filter.keyword),
        ),
      )
      .orderBy(desc(products.sort), desc(products.createdAt))
      .pageSize(filter.pageSize)
      .page(filter.page);
  }

  /**
   * 创建商品
   */
  async create(input: InsertProduct) {
    const [row] = await this.db.insert(products).values(input).returning();

    return row ?? null;
  }

  /**
   * 更新商品
   */
  async update(id: string, input: UpdateProduct) {
    const [row] = await this.db
      .update(products)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(and(eq(products.id, id), deletedAtIsNull(products)))
      .returning();

    return row ?? null;
  }

  /**
   * 更新商品状态
   */
  async updateStatus(id: string, status: ProductStatus) {
    return this.update(id, { status });
  }

  async delete(id: string) {
    const [row] = await this.db
      .update(products)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(products.id, id), deletedAtIsNull(products)))
      .returning();

    return row ?? null;
  }

  /**
   * 行锁商品并返回查询结果
   */
  static async findByIdForUpdate(tx: DbTransaction, id: string) {
    const [product] = await tx.select().from(products).where(eq(products.id, id)).for('update');

    return product;
  }

  /**
   * 增加商品库存
   */
  static async increaseStock(tx: DbTransaction, input: { productId: string; amount: number }) {
    StockAmountPolicy.assertPositiveInteger(input.amount);

    const [product] = await tx
      .update(products)
      .set({
        stock: sql`${products.stock} + ${input.amount}`,
      })
      .where(and(eq(products.id, input.productId), deletedAtIsNull(products)))
      .returning();

    if (!product) {
      throw new StockUpdateFailedError();
    }

    return product;
  }

  /**
   * 减少商品库存
   */
  static async decreaseStock(tx: DbTransaction, input: { productId: string; amount: number }) {
    StockAmountPolicy.assertPositiveInteger(input.amount);

    const [product] = await tx
      .update(products)
      .set({
        stock: sql`${products.stock} - ${input.amount}`,
      })
      .where(
        and(
          eq(products.id, input.productId),
          deletedAtIsNull(products),
          gte(products.stock, input.amount),
        ),
      )
      .returning();

    if (!product) {
      throw new StockInsufficientError();
    }

    return product;
  }
}
