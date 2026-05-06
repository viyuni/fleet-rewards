import type { CreatePointTypeBody, UpdatePointTypeBody } from '@internal/shared/schema';
import type { DbExecutor } from '@server/db';

import { PointTypeNameExistsError, PointTypeNotFoundError, PointTypePolicy } from '../domain';
import { PointTypeRepository } from '../repository';

export interface PointTypeUseCaseDeps {
  pointTypeRepo: PointTypeRepository;
}

export class PointTypeUseCase {
  constructor(private readonly deps: PointTypeUseCaseDeps) {}

  async get(id: string) {
    const pointType = await this.deps.pointTypeRepo.findById(id);

    if (!pointType) {
      throw new PointTypeNotFoundError();
    }

    return pointType;
  }

  async requireAvailableById(id: string, db?: DbExecutor) {
    const pointType = await this.deps.pointTypeRepo.findById(id, db);

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

  async update(id: string, data: UpdatePointTypeBody) {
    const pointType = await this.deps.pointTypeRepo.findById(id);

    if (!pointType) {
      throw new PointTypeNotFoundError();
    }

    return this.deps.pointTypeRepo.update(id, data);
  }

  async enable(id: string) {
    const pointType = await this.deps.pointTypeRepo.findById(id);

    if (!pointType) {
      throw new PointTypeNotFoundError();
    }

    if (pointType.status === 'active') {
      return pointType;
    }

    return this.deps.pointTypeRepo.updateStatus(id, 'active');
  }

  async disable(id: string) {
    const pointType = await this.deps.pointTypeRepo.findById(id);

    if (!pointType) {
      throw new PointTypeNotFoundError();
    }

    if (pointType.status === 'disabled') {
      return pointType;
    }

    return this.deps.pointTypeRepo.updateStatus(id, 'disabled');
  }

  list() {
    return this.deps.pointTypeRepo.list();
  }
}
