import { adminLoginSchema } from '@internal/shared/schema';
import Elysia from 'elysia';

import { appContext } from '#server/admin/context';

export * from './usecase';

export const auth = new Elysia({
  name: 'AuthRoute',
  prefix: '/auth',
  detail: {
    tags: ['Auth'],
  },
})
  .use(appContext)
  .post(
    '/login',
    ({ body, adminAuthUseCase }) => {
      return adminAuthUseCase.login(body);
    },
    {
      body: adminLoginSchema,
      detail: {
        description: '管理员登录',
      },
    },
  );
