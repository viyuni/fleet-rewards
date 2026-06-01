import { BiliRegisterCodeParamsSchema } from '@internal/shared/auth';
import { UserLoginSchema, UserSelfRegisterSchema } from '@internal/shared/user';
import Elysia from 'elysia';

import { appContext } from '#apps/user/context';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_COOKIE_OPTIONS,
  BILI_REGISTER_VERIFIER_COOKIE_NAME,
  BILI_REGISTER_VERIFIER_COOKIE_OPTIONS,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_OPTIONS,
} from '#modules/auth';

import { AuthUseCase } from './usecase';
export * from './usecase';

function getCookieString(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

function removeVerifierCookie(cookie: {
  set: (
    options: typeof BILI_REGISTER_VERIFIER_COOKIE_OPTIONS & { value: string; maxAge: number },
  ) => void;
}) {
  cookie.set({
    ...BILI_REGISTER_VERIFIER_COOKIE_OPTIONS,
    value: '',
    maxAge: 0,
  });
}

export const auth = new Elysia({
  name: 'AuthRoute',
  prefix: '/auth',
  detail: {
    tags: ['Auth'],
  },
})
  .use(appContext)
  .derive(({ authUseCase, biliRegisterUseCase, rewardUseCase, userUseCase }) => ({
    userAuthUseCase: new AuthUseCase({
      authUseCase,
      biliRegisterUseCase,
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
    async ({ body, cookie, userAuthUseCase }) => {
      const user = await userAuthUseCase.register(
        body,
        getCookieString(cookie[BILI_REGISTER_VERIFIER_COOKIE_NAME]?.value),
      );

      removeVerifierCookie(cookie[BILI_REGISTER_VERIFIER_COOKIE_NAME]!);

      return user;
    },
    {
      body: UserSelfRegisterSchema,
      detail: {
        summary: '用户注册',
      },
    },
  )
  .post(
    '/biliRegisterCode',
    async ({ cookie, userAuthUseCase }) => {
      const { verifier, ...result } = await userAuthUseCase.createBiliRegisterCode();

      cookie[BILI_REGISTER_VERIFIER_COOKIE_NAME]!.set({
        ...BILI_REGISTER_VERIFIER_COOKIE_OPTIONS,
        value: verifier,
      });

      return result;
    },
    {
      detail: {
        summary: '生成直播间注册验证码',
      },
    },
  )
  .get(
    '/biliRegisterCode/:code',
    ({ cookie, params, userAuthUseCase }) => {
      return userAuthUseCase.getBiliRegisterCodeStatus(
        params.code,
        getCookieString(cookie[BILI_REGISTER_VERIFIER_COOKIE_NAME]?.value),
      );
    },
    {
      params: BiliRegisterCodeParamsSchema,
      detail: {
        summary: '查询直播间注册验证码状态',
      },
    },
  );
