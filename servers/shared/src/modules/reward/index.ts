import type { DbExecutor } from '@server/db';
import Elysia from 'elysia';

import { RewardErrors } from './domain';
import { RewardRuleUseCase, RewardUseCase } from './usecase';

export * from './domain';
export * from './repository';
export * from './usecase';

export const rewardModule = ({ db }: { db: DbExecutor }) => {
  return new Elysia({ name: 'RewardModule' })
    .error(RewardErrors)
    .decorate('reward', new RewardUseCase(db))
    .decorate('rewardRule', new RewardRuleUseCase(db));
};
