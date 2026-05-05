import type { CreatePointTypeInput, UpdatePointTypeInput } from '@internal/shared/schema';
import type { DbExecutor } from '@server/db';

import { PointTypeNameExistsError, PointTypeNotFoundError, PointTypePolicy } from '../domain';
import { PointTypeRepository } from '../repository';

export class PointTypeUseCase {
  private pointTypeRepo: PointTypeRepository;
  constructor(private readonly db: DbExecutor) {
    this.pointTypeRepo = new PointTypeRepository(db);
  }

  async get(id: string) {
    const pointType = await this.pointTypeRepo.findById(id);

    if (!pointType) {
      throw new PointTypeNotFoundError();
    }

    return pointType;
  }

  static async requireAvailableById(tx: DbExecutor, id: string) {
    const pointTypeRepo = new PointTypeRepository(tx);
    const pointType = await pointTypeRepo.findById(id);

    PointTypePolicy.assertAvailable(pointType);

    return pointType;
  }

  async requireAvailableById(id: string) {
    const pointType = await PointTypeUseCase.requireAvailableById(this.db, id);

    return pointType;
  }

  async create(input: CreatePointTypeInput) {
    const exists = await this.pointTypeRepo.findByName(input.name);

    if (exists) {
      throw new PointTypeNameExistsError();
    }

    return this.pointTypeRepo.create(input);
  }

  async update(id: string, input: UpdatePointTypeInput) {
    const pointType = await this.pointTypeRepo.findById(id);

    if (!pointType) {
      throw new PointTypeNotFoundError();
    }

    return this.pointTypeRepo.update(id, input);
  }

  async enable(id: string) {
    const pointType = await this.pointTypeRepo.findById(id);

    if (!pointType) {
      throw new PointTypeNotFoundError();
    }

    if (pointType.status === 'active') {
      return pointType;
    }

    return this.pointTypeRepo.updateStatus(id, 'active');
  }

  async disable(id: string) {
    const pointType = await this.pointTypeRepo.findById(id);

    if (!pointType) {
      throw new PointTypeNotFoundError();
    }

    if (pointType.status === 'disabled') {
      return pointType;
    }

    return this.pointTypeRepo.updateStatus(id, 'disabled');
  }
}
