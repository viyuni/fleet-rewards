import type { DbExecutor } from '@server/db';

import { OrderRepository, type OrderPageFilter } from '#server/shared/modules/order';

export class UserOrderUseCase {
  private orderRepo: OrderRepository;

  constructor(private readonly db: DbExecutor) {
    this.orderRepo = new OrderRepository(db);
  }

  page(filter: OrderPageFilter) {
    return this.orderRepo.pageBuilder(filter).columns({}).paginate();
  }
}
