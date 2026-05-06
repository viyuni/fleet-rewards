import type { StockMovementPageQuery } from '@internal/shared/schema';
import type { DbExecutor } from '@server/db';

import { StockMovementRepository } from '#server/shared/modules/product';

export class AdminStockMovementUseCase {
  private stockMovementRepo: StockMovementRepository;

  constructor(private readonly db: DbExecutor) {
    this.stockMovementRepo = new StockMovementRepository(db);
  }

  page(query: StockMovementPageQuery) {
    return this.stockMovementRepo.pageBuilder(query).paginate();
  }
}
