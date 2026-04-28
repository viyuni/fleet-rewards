import Elysia from 'elysia';

import { adminContext } from './context';

export * from './repository';
export * from './errors';
export * from './model';

export const admin = new Elysia({
  name: 'AdminRoute',
})
  .use(adminContext)
  .get('/me', ({ userId }) => ({ name: 'Viyuni', userId }), { requiredAuth: true });
