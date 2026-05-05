import { transactionPageQuerySchema } from '@internal/shared/schema';
import { pointModule } from '@server/shared/point';
import Elysia from 'elysia';

import { db } from '#server/admin/db';
import { authGuard } from '#server/admin/modules/auth';

import { AdminPointTransactionUseCase } from './usecase';

export const pointTransactionRoute = new Elysia({
  name: 'PointTransactionRoute',
  prefix: '/transactions',
  detail: {
    tags: ['PointTransaction'],
  },
})
  .use(authGuard)
  .use(pointModule({ db }))
  .decorate('adminPointTransaction', new AdminPointTransactionUseCase(db))
  .get(
    '/',
    ({ adminPointTransaction, query }) => {
      return adminPointTransaction.page(query);
    },
    {
      query: transactionPageQuerySchema,
      requiredAuth: true,
      detail: {
        description: ' 查询积分流水',
      },
    },
  );
