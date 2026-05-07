import { adminLoginSchema } from '@internal/shared/schema';
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from '@server/shared/auth';
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
    async ({ body, cookie, adminAuthUseCase }) => {
      const { user, token } = await adminAuthUseCase.login(body);

      cookie[AUTH_COOKIE_NAME]!.set({
        ...AUTH_COOKIE_OPTIONS,
        value: token,
      });

      return user;
    },
    {
      body: adminLoginSchema,
      detail: {
        description: '管理员登录',
      },
    },
  )
  .post(
    '/logout',
    ({ cookie }) => {
      cookie[AUTH_COOKIE_NAME]!.remove();

      return {
        success: true,
      };
    },
    {
      detail: {
        description: '管理员退出登录',
      },
    },
  );
