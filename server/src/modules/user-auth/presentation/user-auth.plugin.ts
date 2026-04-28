import { jwt } from '@elysia/jwt';
import { Elysia } from 'elysia';

import type { DbClient } from '#server/db';
import { userLoginSchema, userRegisterSchema } from '#shared/schema/auth/user.schema';

import { UserLoginUseCase } from '../application/user-login.usecase';
import { UserRegisterUseCase } from '../application/user-register.usecase';
import { getUserJwtSecret } from './user-jwt';

export function createUserAuthPlugin(db: DbClient) {
  return new Elysia({ prefix: '/auth' })
    .use(
      jwt({
        name: 'userJwt',
        secret: getUserJwtSecret(),
        exp: '7d',
      }),
    )
    .decorate('userAuth', {
      login: new UserLoginUseCase(db),
      register: new UserRegisterUseCase(db),
    })
    .post('/register', ({ body, userAuth }) => userAuth.register.execute(body), {
      body: userRegisterSchema,
    })
    .post(
      '/login',
      async ({ body, userAuth, userJwt }) => {
        const user = await userAuth.login.execute(body);
        const token = await userJwt.sign({
          sub: user.id,
          scope: 'user',
          username: user.username,
        });

        return {
          token,
          user,
        };
      },
      {
        body: userLoginSchema,
      },
    );
}
