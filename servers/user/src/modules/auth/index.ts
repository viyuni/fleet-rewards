import { UserLoginSchema, UserRegisterSchema } from '@internal/shared/user';
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from '@server/shared/auth';
import Elysia from 'elysia';

import { appContext } from '#server/user/context';

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
  .derive(({ authUseCase, userUseCase }) => ({
    userAuthUseCase: new AuthUseCase({
      authUseCase,
      userUseCase,
    }),
  }))
  .post(
    '/login',
    async ({ body, cookie, userAuthUseCase }) => {
      const { user, token } = await userAuthUseCase.login(body);

      cookie[AUTH_COOKIE_NAME]!.set({
        ...AUTH_COOKIE_OPTIONS,
        value: token,
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
