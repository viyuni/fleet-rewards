import Elysia from 'elysia';

import { appContext } from '../../context';
import { rewardRuleRoute } from './reward-rule.route';

export const reward = new Elysia({
  name: 'RewardRoute',
  prefix: '/rewards',
  detail: {
    tags: ['Reward'],
  },
})
  .use(appContext)
  .use(rewardRuleRoute);
