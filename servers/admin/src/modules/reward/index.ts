import Elysia from 'elysia';

import { authGuard } from '../auth';
import { rewardRuleRoute } from './reward-rule.route';

export const reward = new Elysia({
  name: 'RewardRoute',
  prefix: '/rewards',
  detail: {
    tags: ['Reward'],
  },
})
  .use(authGuard)
  .use(rewardRuleRoute);
