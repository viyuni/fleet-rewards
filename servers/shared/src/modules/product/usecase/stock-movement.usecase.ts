import type { StockMovementPageQuery } from '@internal/shared';

import { StockMovementRepository } from '../repository';

export interface StockMovementUseCaseDeps {
  stockMovementRepo: StockMovementRepository;
}

export class StockMovementUseCase {
  constructor(private readonly deps: StockMovementUseCaseDeps) {}

  page(query: StockMovementPageQuery) {
    return this.deps.stockMovementRepo.page(query);
  }
}
