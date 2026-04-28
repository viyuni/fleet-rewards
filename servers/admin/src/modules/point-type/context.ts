import Elysia from 'elysia';

import { auth, authGuard } from '../auth';
import { PointTypeErrors } from './errors';

export const pointTypeContext = new Elysia({ name: 'PointTypeContext' })
  .use(authGuard)
  .use(auth)
  .error(PointTypeErrors);
