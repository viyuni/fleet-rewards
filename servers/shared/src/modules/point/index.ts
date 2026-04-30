import Elysia from 'elysia';

import type { DbExecutor } from '#server/shared/db';

import { PointErrors } from './domain/errors';
import { PointTypeUseCase } from './usecase';

export * from './domain/errors';
export * from './model';
export * from './repository';
export * from './usecase';

export const pointPlugin = ({ db }: { db: DbExecutor }) => {
  return new Elysia({ name: 'PointPlugin' })
    .decorate('pointType', new PointTypeUseCase(db))
    .error(PointErrors);
};
