import { CreateOrderSchema, OrderPageQuerySchema } from '@internal/shared/order';
import Elysia from 'elysia';

import { appContext } from '#server/user/context';

export const order = new Elysia({
  name: 'UserOrderRoute',
  prefix: '/orders',
  detail: {
    tags: ['Order'],
  },
})
  .use(appContext)
  .get(
    '/',
    ({ query, auth: { id: userId }, orderUseCase }) => {
      return orderUseCase.pageMine({
        ...query,
        userId,
      });
    },
    {
      query: OrderPageQuerySchema,
      requiredAuth: true,
      detail: {
        description: '我的订单列表',
      },
    },
  )
  .post(
    '/',
    async ({ body, auth: { id: userId }, orderUseCase }) => {
      const { orderNo } = await orderUseCase.create(userId, body);
      return {
        orderNo,
      };
    },
    {
      body: CreateOrderSchema,
      requiredAuth: true,
      detail: {
        description: '兑换商品',
      },
    },
  );
