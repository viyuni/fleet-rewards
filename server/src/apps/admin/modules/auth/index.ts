import { AdminLoginSchema } from '@internal/shared/admin';
import Elysia from 'elysia';

import { appContext } from '#apps/admin/context';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_COOKIE_OPTIONS,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_OPTIONS,
} from '#modules/auth';
import { UnauthorizedError } from '#utils';

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
      const { user, accessToken, accessTokenExpiresAt, refreshToken, refreshTokenExpiresAt } =
        await adminAuthUseCase.login(body);

      cookie[ACCESS_TOKEN_COOKIE_NAME]!.set({
        ...ACCESS_TOKEN_COOKIE_OPTIONS,
        value: accessToken,
      });

      cookie[REFRESH_TOKEN_COOKIE_NAME]!.set({
        ...REFRESH_TOKEN_COOKIE_OPTIONS,
        value: refreshToken,
      });

      return {
        user,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
      };
    },
    {
      body: AdminLoginSchema,
      detail: {
        description: '管理员登录',
      },
    },
  )
  .post(
    '/refresh',
    async ({ cookie, authUseCase }) => {
      const refreshToken = cookie[REFRESH_TOKEN_COOKIE_NAME]?.value;

      if (!refreshToken || typeof refreshToken !== 'string') {
        throw new UnauthorizedError('未登录');
      }

      const accessToken = await authUseCase.refreshAccessToken(refreshToken);

      cookie[ACCESS_TOKEN_COOKIE_NAME]!.set({
        ...ACCESS_TOKEN_COOKIE_OPTIONS,
        value: accessToken,
      });

      return {
        success: true,
      };
    },
    {
      detail: {
        description: '刷新 AccessToken',
      },
    },
  )
  .post(
    '/logout',
    async ({ cookie, authUseCase }) => {
      const accessToken = cookie[ACCESS_TOKEN_COOKIE_NAME]?.value;

      if (accessToken && typeof accessToken === 'string') {
        await authUseCase.revokeByAccessToken(accessToken);
      }

      cookie[ACCESS_TOKEN_COOKIE_NAME]!.remove();
      cookie[REFRESH_TOKEN_COOKIE_NAME]!.remove();

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
