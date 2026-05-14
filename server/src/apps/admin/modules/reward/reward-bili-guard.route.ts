import { BiliEventIdParamsSchema, BiliEventPageQuerySchema } from '@internal/shared/reward';
import Elysia from 'elysia';

import { appContext } from '../../context';

export const rewardBiliGuardRoute = new Elysia({
  name: 'RewardBiliGuardRoute',
  prefix: '/bili-guard',
  detail: {
    tags: ['RewardBiliGuard'],
  },
})
  .use(appContext)
  .get(
    '/',
    ({ query, rewardUseCase }) => {
      return rewardUseCase.pageBiliGuardEvents(query);
    },
    {
      query: BiliEventPageQuerySchema,
      requiredAdminAuth: true,
      detail: {
        description: '大航海事件列表',
      },
    },
  )

  .post(
    '/:biliEventId/replay',
    ({ params, rewardUseCase }) => {
      return rewardUseCase.replayRewardBiliGuard(params.biliEventId);
    },
    {
      params: BiliEventIdParamsSchema,
      requiredAdminAuth: true,
      detail: {
        description: '按事件快照回放大航海奖励',
      },
    },
  );
