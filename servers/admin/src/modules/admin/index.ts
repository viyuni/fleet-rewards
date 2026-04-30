import Elysia from 'elysia';

import { adminContext } from './context';

export * from './repository';
export * from './errors';

export const admin = new Elysia({
  name: 'AdminRoute',
  prefix: '/admin',
})
  .use(adminContext)
  .get('/me', ({ userId }) => ({ name: 'Viyuni', userId }), {
    requiredAuth: true,
    detail: {
      tags: ['Admin'],
      description: '获取当前管理员信息',
    },
  });
