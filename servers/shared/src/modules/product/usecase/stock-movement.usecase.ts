import type { DbExecutor } from '@server/db';

import { StockMovementRepository } from '../repository';

export class StockMovementUseCase {
  private readonly stockMovementRepo: StockMovementRepository;

  constructor(private readonly db: DbExecutor) {
    this.stockMovementRepo = new StockMovementRepository(db);
  }
}
