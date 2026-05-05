import type { DbExecutor } from '@server/db';

import { OrderRepository } from '#server/shared/modules/order';
import type { OrderPageFilter } from '#server/shared/modules/order';

export class AdminOrderUseCase {
  private orderRepo: OrderRepository;

  constructor(private readonly db: DbExecutor) {
    this.orderRepo = new OrderRepository(db);
  }

  page(filter: OrderPageFilter) {
    return this.orderRepo.pageBuilder(filter).paginate();
  }
}
