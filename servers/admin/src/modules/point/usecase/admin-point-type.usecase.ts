import type { DbExecutor } from '@server/db';
import { PointTypeRepository, type PointTypePageFilter } from '@server/shared/point';

export class AdminPointTypeUseCase {
  private pointTypeRepo: PointTypeRepository;

  constructor(private readonly db: DbExecutor) {
    this.pointTypeRepo = new PointTypeRepository(db);
  }

  page(filter: PointTypePageFilter) {
    return this.pointTypeRepo.pageBuilder(filter).paginate();
  }
}
