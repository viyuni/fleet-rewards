import { treaty } from '@elysia/eden';
import type { UserApp } from '@server/app';

export type UserApi = ReturnType<typeof createApi>;

export function createApi(apiBaseUrl: string) {
  return treaty<UserApp>(apiBaseUrl, {
    throwHttpError: true,
    fetch: {
      credentials: 'include',
    },
  });
}
