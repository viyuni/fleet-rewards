import { adjustBalanceSchema } from '@internal/shared/schema';
import Elysia from 'elysia';

import { appContext } from '../../context';

export const pointAccountRoute = new Elysia({
  name: 'PointAccountRoute',
  prefix: '/accounts',
  detail: {
    tags: ['PointAccount'],
  },
})
  .use(appContext)
  .patch(
    '/balance/adjust',
    ({ pointAccountUseCase, auth: { id: adminId }, body }) => {
      return pointAccountUseCase.adjustBalance(adminId, body);
    },
    {
      requiredAuth: true,
      body: adjustBalanceSchema,
      detail: {
        description: ' 账号积分调整',
      },
    },
  );
