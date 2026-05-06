import { userIdParamsSchema, userPageQuerySchema } from '@internal/shared/schema';
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
      query: userPageQuerySchema,
      requiredAuth: true,
      detail: {
        description: '用户列表',
      },
    },
  )
  .patch(
    '/:id/ban',
    async ({ params, userUseCase }) => {
      const { id, status } = await userUseCase.ban(params.id);

      return {
        id,
        status,
      };
    },
    {
      params: userIdParamsSchema,
      requiredAuth: true,
      detail: {
        description: '封禁用户',
      },
    },
  )
  .patch(
    '/:id/restore',
    async ({ params, userUseCase }) => {
      const { id, status } = await userUseCase.restore(params.id);

      return {
        id,
        status,
      };
    },
    {
      params: userIdParamsSchema,
      requiredAuth: true,
      detail: {
        description: '恢复用户',
      },
    },
  );
