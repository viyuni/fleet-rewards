import { BiliEventIdParamsSchema } from '@internal/shared/reward';
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
