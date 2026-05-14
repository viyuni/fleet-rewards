import { treaty } from '@elysia/eden';
import type { AdminApp } from '@server/app';

export type AdminApi = ReturnType<typeof createAdminApi>;

export function createAdminApi(serverBaseUrl: string) {
  return treaty<AdminApp>(serverBaseUrl, {
    throwHttpError: true,
    fetch: {
      credentials: 'include',
    },
  });
}

export default defineNuxtPlugin(() => {
  const {
    public: { serverBaseUrl },
  } = useRuntimeConfig();

  if (!serverBaseUrl) {
    throw new Error('NUXT_PUBLIC_SERVER_BASE_URL is required to create the Eden client.');
  }

  const api = createAdminApi(serverBaseUrl);

  return {
    provide: {
      api,
    },
  };
});
