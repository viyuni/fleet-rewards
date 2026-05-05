import type { DbExecutor } from '@server/db';

import {
  StockMovementRepository,
  type StockMovementPageFilter,
} from '#server/shared/modules/product';

export class AdminStockMovementUseCase {
  private stockMovementRepo: StockMovementRepository;

  constructor(private readonly db: DbExecutor) {
    this.stockMovementRepo = new StockMovementRepository(db);
  }

  page(filter: StockMovementPageFilter) {
    return this.stockMovementRepo.pageBuilder(filter).paginate();
  }
}
