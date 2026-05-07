import Elysia from 'elysia';

import { appContext } from '#server/admin/context';

export * from './repository';
export * from './domain';

export const admin = new Elysia({
  name: 'AdminRoute',
  prefix: '/admin',
})
  .use(appContext)
  .get('/me', ({ userId, adminUseCase }) => adminUseCase.me(userId), {
    requiredAuth: true,
    detail: {
      tags: ['Admin'],
      description: '获取当前管理员信息',
    },
  });
