import Elysia from 'elysia';

import type { DbClient } from '#db';
import type { ImageEnv } from '#env/image';
import type { RedisEnv } from '#env/redis';
import type { SharedEnv } from '#env/shared';
import { redis } from '#redis';
import { logger } from '#utils/logger';

import { createAuthGuard } from './modules/auth';
import { AuthSessionRedisRepository, BiliRegisterRedisRepository } from './modules/auth/repository';
import { AuthUseCase } from './modules/auth/usecase';
import { BiliRegisterUseCase } from './modules/auth/usecase';
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
export interface CreateSharedContextOptions {
  db: DbClient;
  env: SharedEnv &
    RedisEnv &
    ImageEnv & {
      JWT_SECRET: string;
      DATA_SECRET: string;
    };
}

export interface CreateEventContainerOptions {
  db: DbClient;
  env: SharedEnv &
    RedisEnv & {
      DATA_SECRET: string;
    };
}

export function createContainer({ db, env }: CreateSharedContextOptions) {
  const authSessionRepo = new AuthSessionRedisRepository(redis);
  const biliRegisterRepo = new BiliRegisterRedisRepository(
    redis,
    env.BILI_REGISTER_CODE_TTL_SECONDS,
  );
  const authUseCase = new AuthUseCase(env.JWT_SECRET, authSessionRepo);
  const biliRegisterUseCase = new BiliRegisterUseCase({
    biliRegisterRepo,
    ttlSeconds: env.BILI_REGISTER_CODE_TTL_SECONDS,
  });
  const userBasicInfoCrypto = new UserBasicInfoCrypto(env.DATA_SECRET);

  const userRepo = new UserRepository(db);

  const pointAccountRepo = new PointAccountRepository(db);
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

  const imageUseCase = new ImageUseCase(env.IMAGE_SAVE_PATH);

  const pointTypeUseCase = new PointTypeUseCase({
    imageUseCase,
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
    userBasicInfoCrypto,
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
      authSessionRepo,
      biliRegisterRepo,

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
      biliRegisterUseCase,

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

export function createEventContainer({ db, env }: CreateEventContainerOptions) {
  const biliRegisterRepo = new BiliRegisterRedisRepository(
    redis,
    env.BILI_REGISTER_CODE_TTL_SECONDS,
  );
  const biliRegisterUseCase = new BiliRegisterUseCase({
    biliRegisterRepo,
    ttlSeconds: env.BILI_REGISTER_CODE_TTL_SECONDS,
  });
  const userBasicInfoCrypto = new UserBasicInfoCrypto(env.DATA_SECRET);

  const userRepo = new UserRepository(db);
  const pointAccountRepo = new PointAccountRepository(db);
  const pointTransactionRepo = new PointTransactionRepository(db);
  const pointTypeRepo = new PointTypeRepository(db);
  const biliEventRepo = new BiliEventRepository(db);
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

  const rewardUseCase = new RewardUseCase({
    db,
    pointAccountRepo,
    pointBalanceUseCase,
    pointTransactionRepo,
    pointTypeUseCase,
    biliEventRepo,
    logger: logger.scope('EventRewardUseCase'),
    rewardRuleRepo,
    userUseCase,
  });

  return {
    repositories: {
      userRepo,
      biliRegisterRepo,
      pointAccountRepo,
      pointTransactionRepo,
      pointTypeRepo,
      biliEventRepo,
      rewardRuleRepo,
    },

    useCases: {
      userUseCase,
      biliRegisterUseCase,
      pointTypeUseCase,
      pointBalanceUseCase,
      rewardUseCase,
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
