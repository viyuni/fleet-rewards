import {
  adminCreateSchema,
  adminIdParamsSchema,
  adminPageQuerySchema,
  adminUpdatePasswordSchema,
  adminUpdateSchema,
  superAdminUpdateSchema,
} from '@internal/shared/admin';
import Elysia from 'elysia';

import { appContext } from '#server/admin/context';

import { AdminErrors } from './domain';

export * from './repository';
export * from './domain';

export const admin = new Elysia({
  name: 'AdminRoute',
  prefix: '/admin',
})
  .use(appContext)
  .error(AdminErrors)
  .get('/', ({ query, adminUseCase }) => adminUseCase.page(query), {
    query: adminPageQuerySchema,
    requiredSuperAdminAuth: true,
    detail: {
      tags: ['Admin'],
      description: '管理员列表',
    },
  })
  .get('/me', ({ auth: { id: adminId }, adminUseCase }) => adminUseCase.me(adminId), {
    requiredAuth: true,
    detail: {
      tags: ['Admin'],
      description: '获取当前管理员信息',
    },
  })
  .patch(
    '/me',
    ({ auth: { id: adminId }, body, adminUseCase }) => adminUseCase.updateMe(adminId, body),
    {
      body: adminUpdateSchema,
      requiredAuth: true,
      detail: {
        tags: ['Admin'],
        description: '更新当前管理员信息',
      },
    },
  )
  .post('/', ({ body, adminUseCase }) => adminUseCase.create(body), {
    body: adminCreateSchema,
    requiredSuperAdminAuth: true,
    detail: {
      tags: ['Admin'],
      description: '创建管理员',
    },
  })
  .patch(
    '/:adminId',
    ({ params, body, adminUseCase }) => adminUseCase.update(params.adminId, body),
    {
      body: superAdminUpdateSchema,
      params: adminIdParamsSchema,
      requiredSuperAdminAuth: true,
      detail: {
        tags: ['Admin'],
        description: '超级管理员更新管理员信息',
      },
    },
  )
  .patch('/:adminId/ban', ({ params, adminUseCase }) => adminUseCase.ban(params.adminId), {
    params: adminIdParamsSchema,
    requiredSuperAdminAuth: true,
    detail: {
      tags: ['Admin'],
      description: '封禁普通管理员',
    },
  })
  .patch('/:adminId/restore', ({ params, adminUseCase }) => adminUseCase.restore(params.adminId), {
    params: adminIdParamsSchema,
    requiredSuperAdminAuth: true,
    detail: {
      tags: ['Admin'],
      description: '解封普通管理员',
    },
  })
  .patch(
    '/updatePassword',
    ({ auth: { id: adminId }, body, adminUseCase }) => adminUseCase.updatePassword(adminId, body),
    {
      body: adminUpdatePasswordSchema,
      requiredAuth: true,
      detail: {
        tags: ['Admin'],
        description: '修改管理员密码',
      },
    },
  )
  .patch(
    '/:adminId/resetPassword',
    ({ params, adminUseCase }) => adminUseCase.resetPassword(params.adminId),
    {
      params: adminIdParamsSchema,
      requiredSuperAdminAuth: true,
      detail: {
        tags: ['Admin'],
        description: '重置普通管理员密码',
      },
    },
  );
