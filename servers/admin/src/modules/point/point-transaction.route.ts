import { transactionPageQuerySchema } from '@internal/shared/schema';
import Elysia from 'elysia';

import { appContext } from '#server/admin/context';

export const pointTransactionRoute = new Elysia({
  name: 'PointTransactionRoute',
  prefix: '/transactions',
  detail: {
    tags: ['PointTransaction'],
  },
})
  .use(appContext)
  .get(
    '/',
    ({ pointTransactionUseCase, query }) => {
      return pointTransactionUseCase.page(query);
    },
    {
      query: transactionPageQuerySchema,
      requiredAuth: true,
      detail: {
        description: ' 查询积分流水',
      },
    },
  );
