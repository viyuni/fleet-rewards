import Elysia from 'elysia';

import { authGuard } from '../auth';
import { AdminErrors } from './errors';

export const adminContext = new Elysia({ name: 'AdminContext' }).use(authGuard).error(AdminErrors);
