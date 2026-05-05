import type { DbExecutor } from '@server/db';
import Elysia from 'elysia';

import {
  PointAccountUseCase,
  PointConversionUseCase,
  PointTransactionUseCase,
  PointTypeUseCase,
} from './usecase';

export * from './domain/errors';
export * from './repository';
export * from './usecase';
export * from './domain';
export * from './repository/types';

export const pointModule = ({ db }: { db: DbExecutor }) => {
  return new Elysia({ name: 'PointModule' })
    .decorate('pointType', new PointTypeUseCase(db))
    .decorate('pointAccount', new PointAccountUseCase(db))
    .decorate('pointTransaction', new PointTransactionUseCase(db))
    .decorate('pointConversion', new PointConversionUseCase(db));
};
