import { BiliLoginCodeParamsSchema } from '@internal/shared/auth';
import { UserLoginSchema, UserRegisterSchema } from '@internal/shared/user';
import Elysia from 'elysia';

import { appContext } from '#apps/user/context';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_COOKIE_OPTIONS,
  BILI_LOGIN_VERIFIER_COOKIE_NAME,
  BILI_LOGIN_VERIFIER_COOKIE_OPTIONS,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_OPTIONS,
} from '#modules/auth';

import { AuthUseCase } from './usecase';
export * from './usecase';

function getCookieString(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

export const auth = new Elysia({
  name: 'AuthRoute',
  prefix: '/auth',
  detail: {
    tags: ['Auth'],
  },
})
  .use(appContext)
  .derive(({ authUseCase, biliLoginUseCase, rewardUseCase, userUseCase }) => ({
    userAuthUseCase: new AuthUseCase({
      authUseCase,
      biliLoginUseCase,
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
    '/biliLoginCode',
    async ({ cookie, userAuthUseCase }) => {
      const { verifier, ...result } = await userAuthUseCase.createBiliLoginCode();

      cookie[BILI_LOGIN_VERIFIER_COOKIE_NAME]!.set({
        ...BILI_LOGIN_VERIFIER_COOKIE_OPTIONS,
        value: verifier,
      });

      return result;
    },
    {
      detail: {
        summary: '生成直播间登录码',
      },
    },
  )
  .get(
    '/biliLoginCode/:code',
    ({ cookie, params, userAuthUseCase }) => {
      return userAuthUseCase.getBiliLoginCodeStatus(
        params.code,
        getCookieString(cookie[BILI_LOGIN_VERIFIER_COOKIE_NAME]?.value),
      );
    },
    {
      params: BiliLoginCodeParamsSchema,
      detail: {
        summary: '查询直播间登录码状态',
      },
    },
  )
  .post(
    '/biliLoginCode/:code/confirm',
    async ({ params, cookie, userAuthUseCase }) => {
      const result = await userAuthUseCase.confirmBiliLoginCode(
        params.code,
        getCookieString(cookie[BILI_LOGIN_VERIFIER_COOKIE_NAME]?.value),
      );

      if (result.status === 'expired') {
        cookie[BILI_LOGIN_VERIFIER_COOKIE_NAME]!.remove();
      }

      if ('user' in result) {
        cookie[BILI_LOGIN_VERIFIER_COOKIE_NAME]!.remove();

        cookie[ACCESS_TOKEN_COOKIE_NAME]!.set({
          ...ACCESS_TOKEN_COOKIE_OPTIONS,
          value: result.accessToken!,
        });

        cookie[REFRESH_TOKEN_COOKIE_NAME]!.set({
          ...REFRESH_TOKEN_COOKIE_OPTIONS,
          value: result.refreshToken!,
        });

        return result.user;
      }

      return result;
    },
    {
      params: BiliLoginCodeParamsSchema,
      detail: {
        summary: '确认直播间登录码并登录',
      },
    },
  );
