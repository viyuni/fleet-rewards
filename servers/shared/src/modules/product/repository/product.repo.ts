import type { PageQuery, ProductPageQuery } from '@internal/shared';
import type { DbExecutor, DbTransaction } from '@server/db';
import {
  deletedAtIsNull,
  eqIfDefined,
  keywordLike,
  PageBuilder,
  QueryPageBuilder,
} from '@server/db/helper';
import {
  products,
  type InsertProduct,
  type ProductStatus,
  type UpdateProduct,
} from '@server/db/schema';
import { and, desc, eq, gte, sql } from 'drizzle-orm';

import { StockAmountPolicy, StockInsufficientError, StockUpdateFailedError } from '../domain';

export class ProductRepository {
  constructor(private readonly db: DbExecutor) {}

  /**
   * 获取指定 ID 的商品
   */
  async findById(id: string, db: DbExecutor = this.db) {
    return await db.query.products.findFirst({
      where: {
        id,
        deletedAt: {
          isNull: true,
        },
      },
    });
  }

  /**
   * 创建商品
   */
  async create(input: InsertProduct, db: DbExecutor = this.db) {
    const [row] = await db.insert(products).values(input).returning();

    return row ?? null;
  }

  /**
   * 更新商品
   */
  async update(id: string, data: UpdateProduct, db: DbExecutor = this.db) {
    const [row] = await db
      .update(products)
      .set(data)
      .where(and(eq(products.id, id), deletedAtIsNull(products)))
      .returning();

    return row ?? null;
  }

  /**
   * 更新商品状态
   */
  async updateStatus(id: string, status: ProductStatus, db: DbExecutor = this.db) {
    return this.update(id, { status }, db);
  }

  async delete(id: string, db: DbExecutor = this.db) {
    const [row] = await db
      .update(products)
      .set({
        deletedAt: new Date(),
      })
      .where(and(eq(products.id, id), deletedAtIsNull(products)))
      .returning();

    return row ?? null;
  }

  /**
   * 行锁商品并返回查询结果
   */
  async findByIdForUpdate(tx: DbTransaction, id: string) {
    const [product] = await tx
      .select()
      .from(products)
      .where(and(eq(products.id, id), deletedAtIsNull(products)))
      .for('update');

    return product;
  }

  /**
   * 增加商品库存
   */
  async increaseStock(tx: DbTransaction, input: { productId: string; amount: number }) {
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
  async decreaseStock(tx: DbTransaction, input: { productId: string; amount: number }) {
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

  /**
   * 管理端分页
   */
  async pageManage(query: ProductPageQuery) {
    return new QueryPageBuilder(this.db, products, this.db.query.products)
      .where({
        deletedAt: {
          isNull: true,
        },
        status: query.status,
        deliveryType: query.deliveryType,
        pointTypeId: query.pointTypeId,
        OR: query.keyword
          ? [
              {
                name: {
                  ilike: `%${query.keyword}%`,
                },
              },
              {
                description: {
                  ilike: `%${query.keyword}%`,
                },
              },
            ]
          : undefined,
      })
      .query((findMany, { where, limit, offset }) =>
        findMany({
          where,
          limit,
          offset,
          with: {
            pointType: {
              columns: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
            sort: 'desc',
          },
        }),
      )
      .page(query.page)
      .pageSize(query.pageSize)
      .paginate();
  }

  /**
   * 兑换商城分页
   */
  async pageRedeem(query: PageQuery) {
    return new QueryPageBuilder(this.db, products, this.db.query.products)
      .where({
        deletedAt: {
          isNull: true,
        },
      })
      .query((findMany, { where, limit, offset }) =>
        findMany({
          where,
          limit,
          offset,
          columns: {
            id: true,
            name: true,
            description: true,
            cover: true,
            price: true,
            stock: true,
            deliveryType: true,
          },
          with: {
            pointType: {
              columns: {
                name: true,
              },
            },
          },
        }),
      )
      .page(query.page)
      .pageSize(query.pageSize)
      .paginate();
  }
}
