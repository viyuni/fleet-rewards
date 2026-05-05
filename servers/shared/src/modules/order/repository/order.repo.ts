import type { DbExecutor } from '@server/db';
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

import type { OrderPageFilter } from './types';

export class OrderRepository {
  constructor(protected readonly db: DbExecutor) {}

  pageBuilder(filter: OrderPageFilter) {
    return new PageBuilder(this.db, orders)
      .where(
        and(
          eqIfDefined(orders.status, filter.status),
          eqIfDefined(orders.userId, filter.userId),
          gteIfDefined(orders.createdAt, parseDate(filter.startTime)),
          lteIfDefined(orders.createdAt, parseDate(filter.endTime)),
          keywordLike(
            [orders.orderNo, orders.productNameSnapshot, orders.pointTypeNameSnapshot],
            filter.keyword,
          ),
        ),
      )
      .orderBy(desc(orders.createdAt))
      .page(filter.page)
      .pageSize(filter.pageSize);
  }

  async findById(id: string) {
    return await this.db.query.orders.findFirst({
      where: {
        id,
        deletedAt: {
          isNull: true,
        },
      },
    });
  }

  static async create(tx: DbExecutor, input: InsertOrder) {
    const [row] = await tx.insert(orders).values(input).returning();

    return row;
  }

  async update(id: string, input: UpdateOrder) {
    return await OrderRepository.update(this.db, id, input);
  }

  static async update(tx: DbExecutor, id: string, input: UpdateOrder) {
    const [row] = await tx
      .update(orders)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(and(eq(orders.id, id)))
      .returning();

    return row ?? null;
  }
}
