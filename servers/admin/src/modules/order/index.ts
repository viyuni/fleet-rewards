import {
  OrderIdParamsSchema,
  OrderPageQuerySchema,
  RefundOrderSchema,
} from '@internal/shared/order';
import Elysia from 'elysia';

import { appContext } from '#server/admin/context';

export const order = new Elysia({
  name: 'OrderRoute',
  prefix: '/orders',
  detail: {
    tags: ['Order'],
  },
})

  .use(appContext)
  .get(
    '/',
    ({ query, orderUseCase }) => {
      return orderUseCase.pageManage(query);
    },
    {
      query: OrderPageQuerySchema,
      requiredAuth: true,
      detail: {
        description: '订单列表',
      },
    },
  )
  .get(
    '/:orderId',
    ({ params, orderUseCase }) => {
      return orderUseCase.get(params.orderId);
    },
    {
      params: OrderIdParamsSchema,
      requiredAuth: true,
      detail: {
        description: '订单详情',
      },
    },
  )
  .patch(
    '/:orderId/complete',
    async ({ params, orderUseCase }) => {
      const { id, status } = await orderUseCase.complete(params.orderId);

      return {
        id,
        status,
      };
    },
    {
      params: OrderIdParamsSchema,
      requiredAuth: true,
      detail: {
        description: '完成订单',
      },
    },
  )
  .patch(
    '/:orderId/refund',
    async ({ body, params, orderUseCase }) => {
      const { id, status } = await orderUseCase.refund(params.orderId, body);

      return {
        id,
        status,
      };
    },
    {
      body: RefundOrderSchema,
      params: OrderIdParamsSchema,
      requiredAuth: true,
      detail: {
        description: '退款订单',
      },
    },
  );
