import { adminLoginSchema } from '@internal/shared/schema';
import { createAuthModule } from '@server/shared/auth';
import Elysia from 'elysia';

import { config } from '#server/admin/config';
import { db } from '#server/admin/db';

import { AuthUseCase } from './usecase';

export const { authGuard, authenticator } = createAuthModule(config.JWT_SECRET);

export const auth = new Elysia({
  name: 'AuthRoute',
  prefix: '/auth',
  detail: {
    tags: ['Auth'],
  },
})
  .decorate('auth', new AuthUseCase(db, authenticator))
  .post(
    '/login',
    ({ body, auth }) => {
      return auth.login(body);
    },
    {
      body: adminLoginSchema,
      detail: {
        description: '管理员登录',
      },
    },
  );
