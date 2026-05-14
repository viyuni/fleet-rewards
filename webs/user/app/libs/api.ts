import { treaty } from '@elysia/eden';
import type { UserApp } from '@server/app';

export type UserApi = ReturnType<typeof createApi>;

export function createApi(serverBaseUrl: string) {
  return treaty<UserApp>(serverBaseUrl, {
    throwHttpError: true,
    fetch: {
      credentials: 'include',
    },
  });
}
