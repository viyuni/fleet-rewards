import Elysia from 'elysia';

import { authGuard } from '#server/admin/modules/auth';

export * from './repository';
export * from './domain';

export const admin = new Elysia({
  name: 'AdminRoute',
  prefix: '/admin',
})
  .use(authGuard)
  .get('/me', ({ userId }) => ({ name: 'Viyuni', userId }), {
    requiredAuth: true,
    detail: {
      tags: ['Admin'],
      description: '获取当前管理员信息',
    },
  });
