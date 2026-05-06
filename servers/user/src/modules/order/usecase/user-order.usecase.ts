import type { OrderPageQuery } from '@internal/shared/schema';
import type { DbExecutor } from '@server/db';

import { OrderRepository } from '#server/shared/modules/order';

export class UserOrderUseCase {
  private orderRepo: OrderRepository;

  constructor(private readonly db: DbExecutor) {
    this.orderRepo = new OrderRepository(db);
  }

  page(query: OrderPageQuery) {
    return this.orderRepo.pageBuilder(query).columns({}).paginate();
  }
}
