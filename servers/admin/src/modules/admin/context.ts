import Elysia from 'elysia';

import { auth, authGuard } from '../auth';
import { AdminErrors } from './errors';

export const adminContext = new Elysia({ name: 'AdminContext' })
  .use(authGuard)
  .use(auth)
  .error(AdminErrors);
