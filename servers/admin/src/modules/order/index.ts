import {
  orderIdParamsSchema,
  orderPageQuerySchema,
  refundOrderSchema,
} from '@internal/shared/schema';
import Elysia from 'elysia';

import { appContext } from '../../context';
import { db } from '../../db';
import { AdminOrderUseCase } from './usecase';

export const order = new Elysia({
  name: 'OrderRoute',
  prefix: '/orders',
  detail: {
    tags: ['Order'],
  },
})

  .use(appContext)
  .decorate('adminOrderUseCase', new AdminOrderUseCase(db))
  .get(
    '/',
    ({ query, adminOrderUseCase }) => {
      return adminOrderUseCase.page(query);
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
    ({ params, orderUseCase }) => {
      return orderUseCase.get(params.id);
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
    async ({ params, orderUseCase }) => {
      const { id, status } = await orderUseCase.complete(params.id);

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
    async ({ body, params, orderUseCase }) => {
      const { id, status } = await orderUseCase.refund(params.id, body);

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
