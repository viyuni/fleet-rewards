import Elysia from 'elysia';

import type { DbClient } from '#db';
import { logger } from '#utils';

import { createAuthGuard } from './modules/auth';
import { AuthUseCase } from './modules/auth/usecase';
import { BiliEventRepository } from './modules/bili-event';
import { DashboardRepository, DashboardUseCase } from './modules/dashboard';
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
import { type SharedEnv } from './utils';

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

  const biliEventRepo = new BiliEventRepository(db);
  const rewardRuleRepo = new RewardRuleRepository(db);
  const dashboardRepo = new DashboardRepository(db);

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
    biliEventRepo,
    logger: logger.scope('RewardUseCase'),
    rewardRuleRepo,
    userUseCase,
  });

  const rewardRuleUseCase = new RewardRuleUseCase({
    pointTypeUseCase,
    rewardRuleRepo,
  });

  const dashboardUseCase = new DashboardUseCase(dashboardRepo);

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

      biliEventRepo,
      rewardRuleRepo,
      dashboardRepo,
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
      dashboardUseCase,
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
