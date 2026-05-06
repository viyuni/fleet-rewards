import type { DbClient } from '@server/db';
import Elysia from 'elysia';

import {
  PointAccountRepository,
  PointBalanceUseCase,
  PointTransactionRepository,
  PointTypeRepository,
  PointTypeUseCase,
} from '../point';
import { UserRepository, UserUseCase } from '../user';
import { RewardErrors } from './domain';
import { RewardRuleRepository } from './repository';
import { RewardRuleUseCase, RewardUseCase } from './usecase';

export * from './domain';
export * from './repository';
export * from './usecase';

export const rewardModule = ({ db }: { db: DbClient }) => {
  const userRepo = new UserRepository(db);
  const pointAccountRepo = new PointAccountRepository();
  const pointTransactionRepo = new PointTransactionRepository(db);
  const pointTypeUseCase = new PointTypeUseCase({
    pointTypeRepo: new PointTypeRepository(db),
  });
  const userUseCase = new UserUseCase({
    userRepo,
  });
  const pointBalanceUseCase = new PointBalanceUseCase({
    pointAccountRepo,
    pointTypeUseCase,
    userUseCase,
  });
  const rewardRuleRepo = new RewardRuleRepository(db);
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

  return new Elysia({ name: 'RewardModule' })
    .error(RewardErrors)
    .decorate('rewardUseCase', rewardUseCase)
    .decorate('rewardRuleUseCase', rewardRuleUseCase);
};
