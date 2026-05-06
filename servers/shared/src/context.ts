import type { DbClient } from '@server/db';
import Elysia from 'elysia';

import { createAuthGuard } from './modules/auth';
import { AuthUseCase } from './modules/auth/usecase';
import { OrderRepository, OrderUseCase } from './modules/order';
import {
  PointAccountRepository,
  PointAccountUseCase,
  PointBalanceUseCase,
  PointConversionRuleRepository,
  PointConversionUseCase,
  PointTransactionRepository,
  PointTransactionUseCase,
  PointTypeRepository,
  PointTypeUseCase,
} from './modules/point';
import {
  ProductRepository,
  ProductUseCase,
  StockMovementRepository,
  StockMovementUseCase,
} from './modules/product';
import { RewardRuleRepository, RewardRuleUseCase, RewardUseCase } from './modules/reward';
import { UserRepository, UserUseCase } from './modules/user';

export interface CreateContextOptions {
  db: DbClient;
  secret: string;
}

export function createAppInstances({ db, secret }: CreateContextOptions) {
  const authUseCase = new AuthUseCase(secret);

  const userRepo = new UserRepository(db);
  const pointAccountRepo = new PointAccountRepository();
  const pointConversionRuleRepo = new PointConversionRuleRepository(db);
  const pointTransactionRepo = new PointTransactionRepository(db);
  const pointTypeRepo = new PointTypeRepository(db);
  const orderRepo = new OrderRepository(db);
  const productRepo = new ProductRepository(db);
  const rewardRuleRepo = new RewardRuleRepository(db);
  const stockMovementRepo = new StockMovementRepository(db);

  const userUseCase = new UserUseCase({
    userRepo,
  });

  const pointTypeUseCase = new PointTypeUseCase({
    pointTypeRepo,
  });

  const pointBalanceUseCase = new PointBalanceUseCase({
    pointAccountRepo,
    pointTypeUseCase,
    userUseCase,
  });

  const pointAccountUseCase = new PointAccountUseCase({
    db,
    pointAccountRepo,
    pointBalanceUseCase,
  });

  const pointTransactionUseCase = new PointTransactionUseCase({
    db,
    pointAccountRepo,
    pointBalanceUseCase,
    pointTransactionRepo,
  });

  const pointConversionUseCase = new PointConversionUseCase({
    db,
    pointAccountRepo,
    pointBalanceUseCase,
    pointConversionRuleRepo,
    pointTypeUseCase,
  });

  const productUseCase = new ProductUseCase({
    db,
    pointTypeUseCase,
    productRepo,
    stockMovementRepo,
  });

  const stockMovementUseCase = new StockMovementUseCase({
    stockMovementRepo,
  });

  const orderUseCase = new OrderUseCase({
    db,
    orderRepo,
    pointAccountRepo,
    pointBalanceUseCase,
    pointTypeUseCase,
    productUseCase,
    userUseCase,
  });

  const rewardUseCase = new RewardUseCase({
    db,
    pointAccountRepo,
    pointBalanceUseCase,
    pointTransactionRepo,
    pointTypeUseCase,
    rewardRuleRepo,
    userRepo,
  });

  const rewardRuleUseCase = new RewardRuleUseCase({
    pointTypeUseCase,
    rewardRuleRepo,
  });

  return {
    repositories: {
      userRepo,
      pointAccountRepo,
      pointConversionRuleRepo,
      pointTransactionRepo,
      pointTypeRepo,
      orderRepo,
      productRepo,
      rewardRuleRepo,
      stockMovementRepo,
    },
    useCases: {
      authUseCase,
      userUseCase,
      pointTypeUseCase,
      pointAccountUseCase,
      pointBalanceUseCase,
      pointTransactionUseCase,
      pointConversionUseCase,
      productUseCase,
      stockMovementUseCase,
      orderUseCase,
      rewardUseCase,
      rewardRuleUseCase,
    },
  };
}

export type AppInstances = ReturnType<typeof createAppInstances>;

export function createAppContextPlugin(instances: AppInstances) {
  return new Elysia({ name: 'SharedAppContext' })
    .use(createAuthGuard(instances.useCases.authUseCase))
    .decorate(instances.useCases);
}
export function createAppContext(options: CreateContextOptions) {
  const instances = createAppInstances(options);
  const appContext = createAppContextPlugin(instances);

  return {
    instances,
    appContext,
  };
}

export type AppContext = ReturnType<typeof createAppContext>;
