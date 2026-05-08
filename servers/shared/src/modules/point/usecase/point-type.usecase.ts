import type { CreatePointTypeBody, UpdatePointTypeBody } from '@internal/shared/point-type';
import type { DbExecutor } from '@server/db';

import { PointTypeNameExistsError, PointTypeNotFoundError, PointTypePolicy } from '../domain';
import { PointTypeRepository } from '../repository';

export interface PointTypeUseCaseDeps {
  pointTypeRepo: PointTypeRepository;
}

export class PointTypeUseCase {
  constructor(private readonly deps: PointTypeUseCaseDeps) {}

  async get(pointTypeId: string) {
    const pointType = await this.deps.pointTypeRepo.findById(pointTypeId);

    if (!pointType) {
      throw new PointTypeNotFoundError();
    }

    return pointType;
  }

  async requireAvailableById(pointTypeId: string, db?: DbExecutor) {
    const pointType = await this.deps.pointTypeRepo.findById(pointTypeId, db);

    PointTypePolicy.assertAvailable(pointType);

    return pointType;
  }

  async create(data: CreatePointTypeBody) {
    const exists = await this.deps.pointTypeRepo.findByName(data.name);

    if (exists) {
      throw new PointTypeNameExistsError();
    }

    return this.deps.pointTypeRepo.create(data);
  }

  async update(pointTypeId: string, data: UpdatePointTypeBody) {
    const pointType = await this.deps.pointTypeRepo.findById(pointTypeId);

    if (!pointType) {
      throw new PointTypeNotFoundError();
    }

    return this.deps.pointTypeRepo.update(pointTypeId, data);
  }

  async enable(pointTypeId: string) {
    const pointType = await this.deps.pointTypeRepo.findById(pointTypeId);

    if (!pointType) {
      throw new PointTypeNotFoundError();
    }

    if (pointType.status === 'active') {
      return pointType;
    }

    return this.deps.pointTypeRepo.updateStatus(pointTypeId, 'active');
  }

  async disable(pointTypeId: string) {
    const pointType = await this.deps.pointTypeRepo.findById(pointTypeId);

    if (!pointType) {
      throw new PointTypeNotFoundError();
    }

    if (pointType.status === 'disabled') {
      return pointType;
    }

    return this.deps.pointTypeRepo.updateStatus(pointTypeId, 'disabled');
  }

  list() {
    return this.deps.pointTypeRepo.list();
  }
}
