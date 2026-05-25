import Elysia from 'elysia';

import { BilibiliEventWorker } from '#modules/reward';
import { logger } from '#utils/logger';

import { appContext } from '../../context';
import { rewardBiliGuardRoute } from './reward-bili-guard.route';
import { rewardRuleRoute } from './reward-rule.route';

export const reward = new Elysia({
  name: 'RewardRoute',
  prefix: '/rewards',
  detail: {
    tags: ['Reward'],
  },
})
  .use(appContext)
  .use(rewardBiliGuardRoute)
  .use(rewardRuleRoute)
  .use(instance => {
    const { rewardUseCase } = instance.decorator;

    // oxlint-disable-next-line no-unused-vars
    const _app = new BilibiliEventWorker({ rewardUseCase });

    logger.info('Bilibili Event Worker started...');

    return instance;
  });
