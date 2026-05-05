import type { DbExecutor } from '@server/db';
import { eqIfDefined, gteIfDefined, lteIfDefined, PageBuilder, parseDate } from '@server/db/helper';
import { productStockMovements } from '@server/db/schema';
import { and, desc, eq } from 'drizzle-orm';

import type { StockMovementPageFilter } from './types';

export class StockMovementRepository {
  constructor(private db: DbExecutor) {}

  pageBuilder(filter: StockMovementPageFilter) {
    return new PageBuilder(this.db, productStockMovements)
      .where(
        and(
          eq(productStockMovements.productId, filter.productId),
          eqIfDefined(productStockMovements.type, filter.type),
          gteIfDefined(productStockMovements.createdAt, parseDate(filter.startTime)),
          lteIfDefined(productStockMovements.createdAt, parseDate(filter.endTime)),
        ),
      )
      .orderBy(desc(productStockMovements.createdAt))
      .page(filter.page)
      .pageSize(filter.pageSize);
  }
}
