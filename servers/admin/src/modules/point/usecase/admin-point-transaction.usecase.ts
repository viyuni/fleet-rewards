import type { DbExecutor } from '@server/db';
import { PointTransactionRepository, type PointTransactionPageFilter } from '@server/shared/point';

export class AdminPointTransactionUseCase {
  private pointTransactionRepo: PointTransactionRepository;

  constructor(private readonly db: DbExecutor) {
    this.pointTransactionRepo = new PointTransactionRepository(db);
  }

  page(filter: PointTransactionPageFilter) {
    return this.pointTransactionRepo.pageBuilder(filter).paginate();
  }
}
