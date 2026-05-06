import type { DbClient } from '@server/db';
import Elysia from 'elysia';

import { PointTypeRepository, PointTypeUseCase } from '../point';
import { ProductRepository, StockMovementRepository } from './repository';
import { ProductUseCase, StockMovementUseCase } from './usecase';

export * from './domain';
export * from './repository';
export * from './usecase';

export const productModule = ({ db }: { db: DbClient }) => {
  const pointTypeUseCase = new PointTypeUseCase({
    pointTypeRepo: new PointTypeRepository(db),
  });
  const productRepo = new ProductRepository(db);
  const stockMovementRepo = new StockMovementRepository(db);
  const productUseCase = new ProductUseCase({
    db,
    pointTypeUseCase,
    productRepo,
    stockMovementRepo,
  });
  const stockMovementUseCase = new StockMovementUseCase({
    stockMovementRepo,
  });

  return new Elysia({ name: 'ProductModule' })
    .decorate('productUseCase', productUseCase)
    .decorate('stockMovementUseCase', stockMovementUseCase);
};
