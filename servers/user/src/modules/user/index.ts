import Elysia from 'elysia';

import { appContext } from '#server/user/context';

export const user = new Elysia({
  name: 'UserRoute',
})
  .use(appContext)
  .get('/me', ({ auth: { id: userId }, userUseCase }) => userUseCase.profile(userId), {
    requiredAuth: true,
    detail: {
      tags: ['User'],
      summary: '当前用户信息',
    },
  });
