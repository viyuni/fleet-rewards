import { userLoginSchema, userRegisterSchema } from '@internal/shared';
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from '@server/shared/auth';
import Elysia from 'elysia';

import { appContext } from '#servers/user/context';
import { db } from '#servers/user/db';

import { AuthUseCase } from './usecase';

export const auth = new Elysia({
  name: 'AuthRoute',
  prefix: '/auth',
})
  .use(appContext)
  .derive(({ authUseCase }) => ({
    userAuthUseCase: new AuthUseCase(db, authUseCase),
  }))
  .post(
    '/login',
    async ({ body, cookie, userAuthUseCase }) => {
      const result: unknown = await userAuthUseCase.login(body);

      if (
        result &&
        typeof result === 'object' &&
        'token' in result &&
        typeof result.token === 'string'
      ) {
        cookie[AUTH_COOKIE_NAME]!.set({
          ...AUTH_COOKIE_OPTIONS,
          value: result.token,
        });
      }

      return result;
    },
    {
      body: userLoginSchema,
    },
  )
  .post(
    '/register',
    ({ body, userAuthUseCase }) => {
      return userAuthUseCase.register(body);
    },
    {
      body: userRegisterSchema,
    },
  );
