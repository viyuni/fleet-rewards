import {
  OrderIdParamsSchema,
  OrderPageQuerySchema,
  RefundOrderSchema,
  UpdateOrderExpressSchema,
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
      requiredAdminAuth: true,
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
      requiredAdminAuth: true,
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
      requiredAdminAuth: true,
      detail: {
        description: '完成订单',
      },
    },
  )
  .patch(
    '/:orderId/express',
    async ({ body, params, orderUseCase }) => {
      const { expressCompany, expressNo, id } = await orderUseCase.updateExpress(
        params.orderId,
        body,
      );

      return {
        id,
        expressCompany,
        expressNo,
      };
    },
    {
      body: UpdateOrderExpressSchema,
      params: OrderIdParamsSchema,
      requiredAdminAuth: true,
      detail: {
        description: '修改订单快递信息',
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
      requiredAdminAuth: true,
      detail: {
        description: '退款订单',
      },
    },
  );
