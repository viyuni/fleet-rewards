import { userLoginSchema, userRegisterSchema } from '@internal/shared';
import { setupApp } from '@server/shared/setup-app';
import Elysia from 'elysia';

import { appContext } from '#servers/user/context';
import { db } from '#servers/user/db';

import { UserUseCase as UserAuthUseCase } from './usecase';

export * from './repository';
export * from './usecase';
export * from './errors';
export * from './model';

export const user = setupApp(
  new Elysia({
    name: 'UserRoute',
  }),
)
  .use(appContext)
  .derive(({ authUseCase }) => ({
    userAuthUseCase: new UserAuthUseCase(db, authUseCase),
  }))
  .post(
    '/login',
    ({ body, userAuthUseCase }) => {
      return userAuthUseCase.login(body);
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
    ({ body, userAuthUseCase }) => {
      return userAuthUseCase.register(body);
    },
    {
      body: userRegisterSchema,
      details: {
        summary: '用户注册',
      },
    },
  )
  .get('/me', ({ userId }) => ({ name: 'Viyuni', userId }), { requiredAuth: true });
