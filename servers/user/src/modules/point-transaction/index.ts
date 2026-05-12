import { TransactionPageQuerySchema } from '@internal/shared/point-transaction';
import Elysia from 'elysia';

import { appContext } from '#server/user/context';

export const pointTransaction = new Elysia({
  name: 'PointTransactionRoute',
  prefix: '/point-transactions',
  detail: {
    tags: ['PointTransaction'],
  },
})
  .use(appContext)
  .get(
    '/',
    ({ query, pointTransactionUseCase, auth: { id: userId } }) => {
      return pointTransactionUseCase.pageMine(userId, query);
    },
    {
      query: TransactionPageQuerySchema,
      requiredAuth: true,
      detail: {
        description: '我的积分流水',
      },
    },
  );
