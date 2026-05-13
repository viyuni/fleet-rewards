// plugins/eden.ts
import { treaty } from '@elysia/eden';
import type { App } from '@server/user';

export default defineNuxtPlugin(() => {
  const api = treaty<App>('http://192.168.3.24:3601', {
    throwHttpError: true,
    fetch: {
      credentials: 'include',
    },
  });

  return {
    provide: {
      api,
    },
  };
});
