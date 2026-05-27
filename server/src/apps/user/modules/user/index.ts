import { UserUpdateSchema } from '@internal/shared/user';
import Elysia from 'elysia';

import { appContext } from '#apps/user/context';

export const user = new Elysia({
  name: 'UserRoute',
})
  .use(appContext)
  .get('/me', ({ auth: { id: userId }, userUseCase }) => userUseCase.getDetail(userId), {
    requiredAuth: true,
    detail: {
      tags: ['User'],
      summary: '当前用户信息',
    },
  })
  .put('/me', ({ auth: { id: userId }, body, userUseCase }) => userUseCase.update(userId, body), {
    body: UserUpdateSchema,
    requiredAuth: true,
    detail: {
      tags: ['User'],
      summary: '更新当前用户信息',
    },
  });
