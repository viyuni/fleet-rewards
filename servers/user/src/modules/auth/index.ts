import { userLoginSchema, userRegisterSchema } from '@internal/shared';
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
    ({ body, userAuthUseCase }) => {
      return userAuthUseCase.login(body);
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
