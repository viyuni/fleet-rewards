import type { CreatePointTypeInput, UpdatePointTypeInput } from '@internal/shared/schemas';
import type { DbExecutor } from '@server/db';

import { PointTypeCodeExistsError, PointTypeNotFoundError } from '../domain';
import { PointTypeRepository } from '../repository';

export class PointTypeUseCase {
  private pointTypeRepo: PointTypeRepository;
  constructor(private readonly db: DbExecutor) {
    this.pointTypeRepo = new PointTypeRepository(db);
  }

  async list() {
    return this.pointTypeRepo.list();
  }

  async get(id: string) {
    const pointType = await this.pointTypeRepo.findById(id);

    if (!pointType) {
      throw new PointTypeNotFoundError();
    }

    return pointType;
  }

  async create(input: CreatePointTypeInput) {
    const exists = await this.pointTypeRepo.findByCode(input.code);

    if (exists) {
      throw new PointTypeCodeExistsError();
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
