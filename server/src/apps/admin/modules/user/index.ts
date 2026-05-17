import { UserIdParamsSchema, UserPageQuerySchema, UserRegisterSchema } from '@internal/shared/user';
import Elysia from 'elysia';

import { appContext } from '#apps/admin/context';

export const user = new Elysia({
  name: 'UserRoute',
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
      requiredAdminAuth: true,
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
      requiredAdminAuth: true,
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
      requiredAdminAuth: true,
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
      requiredAdminAuth: true,
      detail: {
        description: '恢复用户',
      },
    },
  )

  .patch(
    '/:userId/resetPassword',
    async ({ params, userUseCase }) => {
      return await userUseCase.resetPassword(params.userId);
    },
    {
      params: UserIdParamsSchema,
      requiredAdminAuth: true,
      detail: {
        description: '重置用户密码',
      },
    },
  );
