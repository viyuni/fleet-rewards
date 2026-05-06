import type { ProductPageQuery } from '@internal/shared/schema';
import type { DbExecutor } from '@server/db';

import { ProductRepository } from '#server/shared/modules/product';

export class AdminProductUseCase {
  private productRepo: ProductRepository;

  constructor(private readonly db: DbExecutor) {
    this.productRepo = new ProductRepository(db);
  }

  page(query: ProductPageQuery) {
    return this.productRepo.pageBuilder(query).paginate();
  }
}
