import Elysia from 'elysia';

import { db } from '#servers/user/db';

import { authGuard } from '../auth';
import { authenticator } from '../auth/authenticator';
import { UserErrors } from './errors';
import { UserUseCase } from './usecase';

export const userContext = new Elysia({ name: 'UserContext' })
  .use(authGuard)
  .error(UserErrors)
  .decorate('user', new UserUseCase(db, authenticator));
