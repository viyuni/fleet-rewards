import { adminLoginSchema } from '@internal/shared/schemas';
import { jwt } from '@server/shared/jwt';
import Elysia from 'elysia';

import { authenticator } from './authenticator';
import { authContext } from './context';

export const authGuard = jwt({ authenticator });

export const auth = new Elysia({
  name: 'AuthRoute',
  prefix: '/auth',
  detail: {
    tags: ['Auth'],
  },
})
  .use(authContext)
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
