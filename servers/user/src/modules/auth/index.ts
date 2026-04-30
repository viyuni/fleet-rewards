import { userLoginSchema, userRegisterSchema } from '@internal/shared';
import { jwt } from '@server/shared/jwt';
import Elysia from 'elysia';

import { authenticator } from './authenticator';
import { authContext } from './context';

export const authGuard = jwt({ authenticator });

export const auth = new Elysia({
  name: 'AuthRoute',
  prefix: '/auth',
})
  .use(authContext)
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
