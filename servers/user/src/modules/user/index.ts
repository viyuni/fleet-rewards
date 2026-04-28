import { setupApp } from '@gr/server-shared/setup-app';
import Elysia from 'elysia';

import { userLoginSchema, userRegisterSchema } from '#shared/schema';

import { userContext } from './context';

export * from './repository';
export * from './usecase';
export * from './errors';
export * from './model';

export const user = setupApp(
  new Elysia({
    name: 'UserRoute',
  }),
)
  .use(userContext)
  .post(
    '/login',
    ({ body, user }) => {
      return user.login(body);
    },
    {
      body: userLoginSchema,
      details: {
        summary: '用户登录',
      },
    },
  )
  .post(
    '/register',
    ({ body, user }) => {
      return user.register(body);
    },
    {
      body: userRegisterSchema,
      details: {
        summary: '用户注册',
      },
    },
  )
  .get('/me', ({ userId }) => ({ name: 'Viyuni', userId }), { requiredAuth: true });
