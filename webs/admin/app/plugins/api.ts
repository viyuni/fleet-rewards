import { treaty } from '@elysia/eden';
import type { AdminApp } from '@server/app';

import { defineNuxtPlugin, useRuntimeConfig } from '#app';

function createAdminApi(apiBaseUrl: string) {
  return treaty<AdminApp>(apiBaseUrl, {
    throwHttpError: true,
    fetch: {
      credentials: 'include',
    },
  });
}

export default defineNuxtPlugin(() => {
  const {
    public: { apiBaseUrl },
  } = useRuntimeConfig();

  if (!apiBaseUrl) {
    throw new Error('NUXT_PUBLIC_API_BASE_URL is required to create the Eden client.');
  }

  const api = createAdminApi(apiBaseUrl);

  return {
    provide: {
      api,
    },
  };
});

export type AdminApi = ReturnType<typeof createAdminApi>;
