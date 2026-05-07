import type { OrderPageQuery } from '@internal/shared/schema';
import type { DbExecutor, DbTransaction } from '@server/db';
import {
  eqIfDefined,
  gteIfDefined,
  keywordLike,
  lteIfDefined,
  PageBuilder,
  parseDate,
} from '@server/db/helper';
import { orders, type InsertOrder, type UpdateOrder } from '@server/db/schema';
import { and, desc, eq } from 'drizzle-orm';

export class OrderRepository {
  constructor(protected readonly db: DbExecutor) {}

  pageBuilder(query: OrderPageQuery) {
    return new PageBuilder(this.db, orders)
      .where(
        and(
          eqIfDefined(orders.status, query.status),
          eqIfDefined(orders.userId, query.userId),
          gteIfDefined(orders.createdAt, parseDate(query.startTime)),
          lteIfDefined(orders.createdAt, parseDate(query.endTime)),
          keywordLike(
            [orders.orderNo, orders.productNameSnapshot, orders.pointTypeNameSnapshot],
            query.keyword,
          ),
        ),
      )
      .orderBy(desc(orders.createdAt))
      .page(query.page)
      .pageSize(query.pageSize);
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
