import { createOrderSchema, orderPageQuerySchema } from '@internal/shared/schema';
import Elysia from 'elysia';

import { appContext } from '#servers/user/context';

import { db } from '../../db';
import { UserOrderUseCase } from './usecase';

export const order = new Elysia({
  name: 'UserOrderRoute',
  prefix: '/orders',
  detail: {
    tags: ['Order'],
  },
})
  .use(appContext)
  .decorate('userOrderUseCase', new UserOrderUseCase(db))
  .get(
    '/',
    ({ query, userId, userOrderUseCase }) => {
      return userOrderUseCase.page({
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
    async ({ body, userId, orderUseCase }) => {
      const { orderNo } = await orderUseCase.create(userId, body);
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
