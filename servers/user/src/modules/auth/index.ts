import { userLoginSchema, userRegisterSchema } from '@internal/shared';
import { createAuthModule } from '@server/shared/auth';
import Elysia from 'elysia';

import { config } from '#servers/user/config';
import { db } from '#servers/user/db';

import { AuthUseCase } from './usecase';

export const { authGuard, authenticator } = createAuthModule(config.JWT_SECRET);

export const auth = new Elysia({
  name: 'AuthRoute',
  prefix: '/auth',
})
  .decorate('auth', new AuthUseCase(db, authenticator))
  .post(
    '/login',
    ({ body, auth }) => {
      return auth.login(body);
    },
    {
      body: userLoginSchema,
    },
  )
  .post(
    '/register',
    ({ body, auth }) => {
      return auth.register(body);
    },
    {
      body: userRegisterSchema,
    },
  );
