import { UserIdParamsSchema, UserPageQuerySchema, UserRegisterSchema } from '@internal/shared/user';
import Elysia from 'elysia';

import { appContext } from '#server/admin/context';

export const users = new Elysia({
  name: 'UsersRoute',
  prefix: '/users',
  detail: {
    tags: ['User'],
  },
})
  .use(appContext)
  .get(
    '/',
    ({ query, userUseCase }) => {
      return userUseCase.page(query);
    },
    {
      query: UserPageQuerySchema,
      requiredAuth: true,
      detail: {
        description: '用户列表',
      },
    },
  )
  .post(
    '/',
    async ({ body, userUseCase }) => {
      return await userUseCase.create(body);
    },
    {
      body: UserRegisterSchema,
      requiredAuth: true,
      detail: {
        description: '用户注册',
      },
    },
  )
  .patch(
    '/:userId/ban',
    async ({ params, userUseCase }) => {
      const { id, status } = await userUseCase.ban(params.userId);

      return {
        id,
        status,
      };
    },
    {
      params: UserIdParamsSchema,
      requiredAuth: true,
      detail: {
        description: '封禁用户',
      },
    },
  )
  .patch(
    '/:userId/restore',
    async ({ params, userUseCase }) => {
      const { id, status } = await userUseCase.restore(params.userId);

      return {
        id,
        status,
      };
    },
    {
      params: UserIdParamsSchema,
      requiredAuth: true,
      detail: {
        description: '恢复用户',
      },
    },
  );
