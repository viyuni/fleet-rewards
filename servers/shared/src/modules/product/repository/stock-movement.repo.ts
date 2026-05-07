import type { StockMovementPageQuery } from '@internal/shared/schema';
import type { DbExecutor } from '@server/db';
import { parseDate, QueryPageBuilder } from '@server/db/helper';
import { productStockMovements, type InsertProductStockMovement } from '@server/db/schema';

export class StockMovementRepository {
  constructor(private readonly db: DbExecutor) {}

  page(query: StockMovementPageQuery) {
    return new QueryPageBuilder(this.db, productStockMovements, this.db.query.productStockMovements)
      .page(query.page)
      .pageSize(query.pageSize)
      .where({
        productId: query.productId,
        type: query.type,
        createdAt: {
          gte: parseDate(query.startTime),
          lte: parseDate(query.endTime),
        },
      })
      .query((findMany, { where, limit, offset }) =>
        findMany({
          where,
          limit,
          offset,
          with: {
            product: {
              columns: {
                id: true,
                name: true,
                pointTypeId: true,
              },
            },
          },
        }),
      )
      .paginate();
  }

  async create(input: InsertProductStockMovement, db: DbExecutor = this.db) {
    const [movement] = await db.insert(productStockMovements).values(input).returning();

    return movement ?? null;
  }
}
