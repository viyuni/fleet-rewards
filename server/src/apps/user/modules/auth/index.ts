import { LiveLoginCodeParamsSchema } from '@internal/shared/auth';
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
  .derive(({ authUseCase, liveLoginUseCase, rewardUseCase, userUseCase }) => ({
    userAuthUseCase: new AuthUseCase({
      authUseCase,
      liveLoginUseCase,
      rewardUseCase,
      userUseCase,
    }),
  }))
  .post(
    '/login',
    async ({ body, cookie, userAuthUseCase }) => {
      const { user, accessToken, accessTokenExpiresAt, refreshToken, refreshTokenExpiresAt } =
        await userAuthUseCase.login(body);

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
        summary: '刷新 AccessToken',
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
  )
  .post(
    '/liveCode',
    ({ userAuthUseCase }) => {
      return userAuthUseCase.createLiveCode();
    },
    {
      detail: {
        summary: '生成直播间登录码',
      },
    },
  )
  .get(
    '/liveCode/:code',
    ({ params, userAuthUseCase }) => {
      return userAuthUseCase.getLiveCodeStatus(params.code);
    },
    {
      params: LiveLoginCodeParamsSchema,
      detail: {
        summary: '查询直播间登录码状态',
      },
    },
  )
  .post(
    '/liveCode/:code/confirm',
    async ({ params, cookie, userAuthUseCase }) => {
      const result = await userAuthUseCase.confirmLiveCode(params.code);

      if ('user' in result) {
        cookie[ACCESS_TOKEN_COOKIE_NAME]!.set({
          ...ACCESS_TOKEN_COOKIE_OPTIONS,
          value: result.accessToken!,
        });

        cookie[REFRESH_TOKEN_COOKIE_NAME]!.set({
          ...REFRESH_TOKEN_COOKIE_OPTIONS,
          value: result.refreshToken!,
        });

        return {
          user: result.user,
          accessTokenExpiresAt: result.accessTokenExpiresAt,
          refreshTokenExpiresAt: result.refreshTokenExpiresAt,
        };
      }

      return result;
    },
    {
      params: LiveLoginCodeParamsSchema,
      detail: {
        summary: '确认直播间登录码并登录',
      },
    },
  );
