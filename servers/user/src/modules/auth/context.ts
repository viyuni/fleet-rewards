import { db } from '@gr/server-shared/db';
import Elysia from 'elysia';

import { authenticator } from './authenticator';
import { AuthErrors } from './errors';
import { AuthUseCase } from './usecase';

export const authContext = new Elysia({
  name: 'AuthContext',
})
  .error(AuthErrors)
  .decorate('auth', new AuthUseCase(db, authenticator));
