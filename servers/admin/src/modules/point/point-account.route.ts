import { adjustBalanceSchema } from '@internal/shared/schema';
import { pointModule } from '@server/shared/point';
import Elysia from 'elysia';

import { db } from '#server/admin/db';
import { authGuard } from '#server/admin/modules/auth';

export const pointAccountRoute = new Elysia({
  name: 'PointAccountRoute',
  prefix: '/accounts',
  detail: {
    tags: ['PointAccount'],
  },
})
  .use(authGuard)
  .use(pointModule({ db }))
  .patch(
    '/adjust-balance',
    ({ pointAccount, userId: adminId, body }) => {
      return pointAccount.adjustBalance(adminId, body);
    },
    {
      requiredAuth: true,
      body: adjustBalanceSchema,
      detail: {
        description: ' 账号积分调整',
      },
    },
  );
