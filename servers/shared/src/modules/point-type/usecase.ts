import type { UpdatePointTypeInput, CreatePointTypeInput } from '#shared/schema';

import { PointTypeCodeExistsError, PointTypeNotFoundError } from './errors';
import type { PointTypeRepository } from './repository';

export class PointTypeUseCase {
  constructor(private readonly pointTypeRepository: PointTypeRepository) {}

  async list() {
    return this.pointTypeRepository.list();
  }

  async get(id: string) {
    const pointType = await this.pointTypeRepository.findById(id);

    if (!pointType) {
      throw new PointTypeNotFoundError();
    }

    return pointType;
  }

  async create(input: CreatePointTypeInput) {
    const exists = await this.pointTypeRepository.findByCode(input.code);

    if (exists) {
      throw new PointTypeCodeExistsError();
    }

    return this.pointTypeRepository.create(input);
  }

  async update(id: string, input: UpdatePointTypeInput) {
    const pointType = await this.pointTypeRepository.findById(id);

    if (!pointType) {
      throw new PointTypeNotFoundError();
    }

    return this.pointTypeRepository.update(id, input);
  }

  async enable(id: string) {
    const pointType = await this.pointTypeRepository.findById(id);

    if (!pointType) {
      throw new PointTypeNotFoundError();
    }

    if (pointType.status === 'active') {
      return pointType;
    }

    return this.pointTypeRepository.updateStatus(id, 'active');
  }

  async disable(id: string) {
    const pointType = await this.pointTypeRepository.findById(id);

    if (!pointType) {
      throw new PointTypeNotFoundError();
    }

    if (pointType.status === 'disabled') {
      return pointType;
    }

    return this.pointTypeRepository.updateStatus(id, 'disabled');
  }
}
