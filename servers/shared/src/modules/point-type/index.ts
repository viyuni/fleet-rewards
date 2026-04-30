import Elysia from 'elysia';

import type { Db } from '#server/shared/db';

import { PointTypeErrors } from './errors';
import { PointTypeRepository } from './repository';
import { PointTypeUseCase } from './usecase';

export * from './repository';
export * from './usecase';
export * from './errors';
export * from './model';

export const pointTypePlugin = ({ db }: { db: Db }) => {
  const repository = new PointTypeRepository(db);
  return new Elysia({ name: 'PointTypePlugin' })
    .decorate('pointType', new PointTypeUseCase(repository))
    .error(PointTypeErrors);
};
