import type { DbClient } from '@server/db';
import Elysia from 'elysia';

import {
  PointAccountRepository,
  PointBalanceUseCase,
  PointTypeRepository,
  PointTypeUseCase,
} from '../point';
import { ProductRepository, ProductUseCase, StockMovementRepository } from '../product';
import { UserRepository, UserUseCase } from '../user';
import { OrderRepository } from './repository';
import { OrderUseCase } from './usecase';

export * from './domain';
export * from './repository';
export * from './usecase';

export const orderModule = ({ db }: { db: DbClient }) => {
  const userUseCase = new UserUseCase({
    userRepo: new UserRepository(db),
  });
  const pointAccountRepo = new PointAccountRepository();
  const pointTypeUseCase = new PointTypeUseCase({
    pointTypeRepo: new PointTypeRepository(db),
  });
  const pointBalanceUseCase = new PointBalanceUseCase({
    pointAccountRepo,
    pointTypeUseCase,
    userUseCase,
  });
  const productUseCase = new ProductUseCase({
    db,
    pointTypeUseCase,
    productRepo: new ProductRepository(db),
    stockMovementRepo: new StockMovementRepository(db),
  });
  const orderUseCase = new OrderUseCase({
    db,
    orderRepo: new OrderRepository(db),
    pointAccountRepo,
    pointBalanceUseCase,
    pointTypeUseCase,
    productUseCase,
    userUseCase,
  });

  return new Elysia({ name: 'OrderModule' }).decorate('orderUseCase', orderUseCase);
};
