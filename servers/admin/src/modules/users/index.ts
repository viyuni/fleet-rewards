import { userIdParamsSchema, userPageQuerySchema } from '@internal/shared/schema';
import { userModule } from '@server/shared/user';
import Elysia from 'elysia';

import { db } from '#server/admin/db';
import { authGuard } from '#server/admin/modules/auth';

export const users = new Elysia({
  name: 'UsersRoute',
  prefix: '/users',
  detail: {
    tags: ['User'],
  },
})
  .use(authGuard)
  .use(userModule({ db }))
  .get(
    '/',
    ({ query, user }) => {
      return user.list(query);
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
    async ({ params, user }) => {
      const { id, status } = await user.ban(params.id);

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
    async ({ params, user }) => {
      const { id, status } = await user.restore(params.id);

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
