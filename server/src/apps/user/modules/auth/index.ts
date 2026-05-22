import { UserLoginSchema, UserRegisterSchema } from '@internal/shared/user';
import Elysia from 'elysia';

import { appContext } from '#apps/user/context';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_COOKIE_OPTIONS,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_OPTIONS,
} from '#modules/auth';
import { UnauthorizedError } from '#utils';

import { AuthUseCase } from './usecase';
export * from './usecase';

export const auth = new Elysia({
  name: 'AuthRoute',
  prefix: '/auth',
  detail: {
    tags: ['Auth'],
  },
})
  .use(appContext)
  .derive(({ authUseCase, rewardUseCase, userUseCase }) => ({
    userAuthUseCase: new AuthUseCase({
      authUseCase,
      rewardUseCase,
      userUseCase,
    }),
  }))
  .post(
    '/login',
    async ({ body, cookie, userAuthUseCase }) => {
      const { user, accessToken, refreshToken } = await userAuthUseCase.login(body);

      cookie[ACCESS_TOKEN_COOKIE_NAME]!.set({
        ...ACCESS_TOKEN_COOKIE_OPTIONS,
        value: accessToken,
      });
      cookie[REFRESH_TOKEN_COOKIE_NAME]!.set({
        ...REFRESH_TOKEN_COOKIE_OPTIONS,
        value: refreshToken,
      });

      return user;
    },
    {
      body: UserLoginSchema,
      detail: {
        summary: '用户登录',
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
        summary: '刷新 accessToken',
      },
    },
  )
  .post(
    '/logout',
    ({ cookie }) => {
      cookie[ACCESS_TOKEN_COOKIE_NAME]!.remove();
      cookie[REFRESH_TOKEN_COOKIE_NAME]!.remove();

      return {
        success: true,
      };
    },
    {
      detail: {
        summary: '用户退出登录',
      },
    },
  )
  .post(
    '/register',
    ({ body, userAuthUseCase }) => {
      return userAuthUseCase.register(body);
    },
    {
      body: UserRegisterSchema,
      detail: {
        summary: '用户注册',
      },
    },
  );
