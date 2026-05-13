// plugins/eden.ts
import { treaty } from '@elysia/eden';
import type { App } from '@server/user';

export default defineNuxtPlugin(() => {
  const api = treaty<App>('http://192.168.2.4:3600', {
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
