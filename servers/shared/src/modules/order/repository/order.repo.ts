import type { OrderPageQuery } from '@internal/shared/schema';
import type { DbExecutor, DbTransaction } from '@server/db';
import { parseDate, QueryPageBuilder } from '@server/db/helper';
import { orders, type InsertOrder, type UpdateOrder } from '@server/db/schema';
import { and, eq } from 'drizzle-orm';

export class OrderRepository {
  constructor(protected readonly db: DbExecutor) {}

  /**
   * 管理员 - 订单列表
   */
  pageManage(query: OrderPageQuery) {
    return new QueryPageBuilder(this.db, orders, this.db.query.orders)
      .page(query.page)
      .pageSize(query.pageSize)
      .where({
        status: query.status,
        userId: query.userId,
        createdAt: {
          gte: parseDate(query.startTime),
          lte: parseDate(query.endTime),
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
      })
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
            pointTypeNameSnapshot: true,
            deliveryTypeSnapshot: true,
            status: true,
            receiverPhoneEncrypted: true,
            receiverAddressEncrypted: true,
            userRemark: true,
            refundReason: true,
            completedAt: true,
            refundedAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
      )
      .paginate();
  }

  async findById(id: string, db: DbExecutor = this.db) {
    return await db.query.orders.findFirst({
      where: {
        id,
      },
    });
  }

  async create(tx: DbTransaction, input: InsertOrder) {
    const [row] = await tx.insert(orders).values(input).returning();

    return row;
  }

  async update(id: string, data: UpdateOrder, db: DbExecutor = this.db) {
    const [row] = await db
      .update(orders)
      .set(data)
      .where(and(eq(orders.id, id)))
      .returning();

    return row ?? null;
  }
}
