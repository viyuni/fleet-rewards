import type { StockMovementPageQuery } from '@internal/shared/schema';
import type { DbExecutor } from '@server/db';
import { eqIfDefined, gteIfDefined, lteIfDefined, PageBuilder, parseDate } from '@server/db/helper';
import { productStockMovements, type InsertProductStockMovement } from '@server/db/schema';
import { and, desc, eq } from 'drizzle-orm';

export class StockMovementRepository {
  constructor(private readonly db: DbExecutor) {}

  pageBuilder(query: StockMovementPageQuery) {
    return new PageBuilder(this.db, productStockMovements)
      .where(
        and(
          eq(productStockMovements.productId, query.productId),
          eqIfDefined(productStockMovements.type, query.type),
          gteIfDefined(productStockMovements.createdAt, parseDate(query.startTime)),
          lteIfDefined(productStockMovements.createdAt, parseDate(query.endTime)),
        ),
      )
      .orderBy(desc(productStockMovements.createdAt))
      .page(query.page)
      .pageSize(query.pageSize);
  }

  async create(input: InsertProductStockMovement, db: DbExecutor = this.db) {
    const [movement] = await db.insert(productStockMovements).values(input).returning();

    return movement ?? null;
  }
}
