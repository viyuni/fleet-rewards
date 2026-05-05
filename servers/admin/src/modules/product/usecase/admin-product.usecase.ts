import type { DbExecutor } from '@server/db';

import { ProductRepository, type ProductPageFilter } from '#server/shared/modules/product';

export class AdminProductUseCase {
  private productRepo: ProductRepository;

  constructor(private readonly db: DbExecutor) {
    this.productRepo = new ProductRepository(db);
  }

  page(filter: ProductPageFilter) {
    return this.productRepo.pageBuilder(filter).paginate();
  }
}
