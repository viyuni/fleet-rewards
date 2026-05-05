import type { DbExecutor } from '@server/db';
import Elysia from 'elysia';

import { ProductUseCase, StockMovementUseCase } from './usecase';

export * from './domain';
export * from './domain';
export * from './repository';
export * from './usecase';

export const productModule = ({ db }: { db: DbExecutor }) => {
  return new Elysia({ name: 'ProductModule' })
    .decorate('product', new ProductUseCase(db))
    .decorate('stockMovement', new StockMovementUseCase(db));
};
