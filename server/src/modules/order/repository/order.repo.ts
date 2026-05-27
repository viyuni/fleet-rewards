import type { OrderPageQuery } from '@internal/shared/order';
import { and, eq, inArray } from 'drizzle-orm';

import type { DbExecutor, DbTransaction } from '#db';
import { QueryPageBuilder } from '#db/helper';
import { orders, users, type InsertOrder, type UpdateOrder } from '#db/schema';

export class OrderRepository {
  constructor(protected readonly db: DbExecutor) {}

  private buildManageWhere(query: OrderPageQuery) {
    return {
      status: query.status,
      userId: query.userId,
      createdAt: {
        gte: query.startAt ?? undefined,
        lte: query.endAt ?? undefined,
      },
      OR: query.keyword
        ? [
            {
              productNameSnapshot: {
                ilike: `%${query.keyword}%`,
              },
            },
            {
              pointTypeNameSnapshot: {
                ilike: `%${query.keyword}%`,
              },
            },
          ]
        : [],
    };
  }

  /**
   * 管理员 - 订单列表
   */
  pageManage(query: OrderPageQuery) {
    return new QueryPageBuilder(this.db, orders, this.db.query.orders)
      .page(query.page)
      .pageSize(query.pageSize)
      .where(this.buildManageWhere(query))
      .query((findMany, { where, limit, offset }) =>
        findMany({
          where,
          limit,
          offset,
          orderBy: {
            createdAt: 'desc',
          },
        }),
      )
      .paginate();
  }

  /**
   * 用户订单列表
   */
  pageMine(query: OrderPageQuery) {
    return new QueryPageBuilder(this.db, orders, this.db.query.orders)
      .page(query.page)
      .pageSize(query.pageSize)
      .where({
        status: query.status,
        userId: query.userId,
      })
      .query((findMany, { where, limit, offset }) =>
        findMany({
          where,
          limit,
          offset,
          columns: {
            id: true,
            orderNo: true,
            productId: true,
            price: true,
            productNameSnapshot: true,
            productDetailSnapshot: true,
            pointTypeNameSnapshot: true,
            deliveryTypeSnapshot: true,
            status: true,
            receiverPhoneEncrypted: true,
            receiverAddressEncrypted: true,
            userRemark: true,
            refundReason: true,
            completedAt: true,
            refundedAt: true,
            expressCompany: true,
            expressNo: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
      )
      .paginate();
  }

  async findById(orderId: string, db: DbExecutor = this.db) {
    return await db.query.orders.findFirst({
      where: {
        id: orderId,
      },
    });
  }

  async findExportRowsByIds(orderIds: string[], db: DbExecutor = this.db) {
    if (!orderIds.length) {
      return [];
    }

    return await db
      .select({
        id: orders.id,
        orderNo: orders.orderNo,
        username: users.username,
        productName: orders.productNameSnapshot,
        createdAt: orders.createdAt,
        receiverPhoneEncrypted: orders.receiverPhoneEncrypted,
        receiverAddressEncrypted: orders.receiverAddressEncrypted,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .where(inArray(orders.id, orderIds))
      .orderBy(orders.createdAt);
  }

  async create(tx: DbTransaction, input: InsertOrder) {
    const [row] = await tx.insert(orders).values(input).returning();

    return row;
  }

  async update(orderId: string, data: UpdateOrder, db: DbExecutor = this.db) {
    const [row] = await db
      .update(orders)
      .set(data)
      .where(and(eq(orders.id, orderId)))
      .returning();

    return row ?? null;
  }
}
