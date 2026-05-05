import { createOrderSchema, orderPageQuerySchema } from '@internal/shared/schema';
import { orderModule } from '@server/shared/order';
import Elysia from 'elysia';

import { db } from '../../db';
import { authGuard } from '../auth';
import { UserOrderUseCase } from './usecase';

export const order = new Elysia({
  name: 'UserOrderRoute',
  prefix: '/orders',
  detail: {
    tags: ['Order'],
  },
})
  .use(authGuard)
  .use(orderModule({ db }))
  .decorate('userOrder', new UserOrderUseCase(db))
  .get(
    '/',
    ({ query, userId, userOrder }) => {
      return userOrder.page({
        ...query,
        userId,
      });
    },
    {
      query: orderPageQuerySchema,
      requiredAuth: true,
      detail: {
        description: '我的订单列表',
      },
    },
  )
  .post(
    '/',
    async ({ body, userId, order }) => {
      const { orderNo } = await order.create(userId, body);
      return {
        orderNo,
      };
    },
    {
      body: createOrderSchema,
      requiredAuth: true,
      detail: {
        description: '兑换商品',
      },
    },
  );
