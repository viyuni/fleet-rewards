import {
  orderIdParamsSchema,
  orderPageQuerySchema,
  refundOrderSchema,
} from '@internal/shared/schema';
import { orderModule } from '@server/shared/order';
import Elysia from 'elysia';

import { db } from '../../db';
import { authGuard } from '../auth';
import { AdminOrderUseCase } from './usecase';

export const order = new Elysia({
  name: 'OrderRoute',
  prefix: '/orders',
  detail: {
    tags: ['Order'],
  },
})
  .use(authGuard)
  .use(orderModule({ db }))
  .decorate('adminOrder', new AdminOrderUseCase(db))
  .get(
    '/',
    ({ query, adminOrder }) => {
      return adminOrder.page(query);
    },
    {
      query: orderPageQuerySchema,
      requiredAuth: true,
      detail: {
        description: '订单列表',
      },
    },
  )
  .get(
    '/:id',
    ({ params, order }) => {
      return order.get(params.id);
    },
    {
      params: orderIdParamsSchema,
      requiredAuth: true,
      detail: {
        description: '订单详情',
      },
    },
  )
  .patch(
    '/:id/complete',
    async ({ params, order }) => {
      const { id, status } = await order.complete(params.id);

      return {
        id,
        status,
      };
    },
    {
      params: orderIdParamsSchema,
      requiredAuth: true,
      detail: {
        description: '完成订单',
      },
    },
  )
  .patch(
    '/:id/refund',
    async ({ body, params, order }) => {
      const { id, status } = await order.refund(params.id, body);

      return {
        id,
        status,
      };
    },
    {
      body: refundOrderSchema,
      params: orderIdParamsSchema,
      requiredAuth: true,
      detail: {
        description: '退款订单',
      },
    },
  );
