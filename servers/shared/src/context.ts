import type { DbClient } from '@server/db';
import Elysia from 'elysia';

import { createAuthGuard } from './modules/auth';
import { AuthUseCase } from './modules/auth/usecase';
import { ImageUseCase } from './modules/image';
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
import { UserBasicInfoCrypto, UserRepository, UserUseCase } from './modules/user';
import type { SharedEnv } from './utils';

export interface CreateSharedContextOptions {
  db: DbClient;
  env: SharedEnv & {
    JWT_SECRET: string;
    DATA_SECRET: string;
  };
}

export function createContainer({ db, env }: CreateSharedContextOptions) {
  const authUseCase = new AuthUseCase(env.JWT_SECRET);
  const userBasicInfoCrypto = new UserBasicInfoCrypto(env.DATA_SECRET);

  const userRepo = new UserRepository(db);

  const pointAccountRepo = new PointAccountRepository();
  const pointConversionRuleRepo = new PointConversionRuleRepository(db);
  const pointTransactionRepo = new PointTransactionRepository(db);
  const pointTypeRepo = new PointTypeRepository(db);

  const orderRepo = new OrderRepository(db);

  const productRepo = new ProductRepository(db);
  const stockMovementRepo = new StockMovementRepository(db);

  const rewardRuleRepo = new RewardRuleRepository(db);

  const userUseCase = new UserUseCase({
    userBasicInfoCrypto,
    userRepo,
  });

  const pointTypeUseCase = new PointTypeUseCase({
    pointTypeRepo,
  });

  const pointBalanceUseCase = new PointBalanceUseCase({
    pointAccountRepo,
    pointTransactionRepo,
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

  const imageUseCase = new ImageUseCase(env.IMAGE_SAVE_PATH);

  const productUseCase = new ProductUseCase({
    db,
    pointTypeUseCase,
    productRepo,
    stockMovementRepo,
    imageUseCase,
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
    userUseCase,
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
      stockMovementRepo,

      rewardRuleRepo,
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

export function createAppContext(options: CreateSharedContextOptions) {
  const container = createContainer(options);
  const context = new Elysia({
    name: 'SharedContext',
  })
    .use(createAuthGuard(container.useCases.authUseCase))
    .decorate(container.useCases);

  return {
    container,
    context,
  };
}
