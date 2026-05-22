import { type Treaty } from '@elysia/eden';
import type { AdminApp } from '@server/app';

import { defineNuxtPlugin, useRuntimeConfig } from '#app';

export default defineNuxtPlugin(() => {
  const {
    public: { apiBaseUrl },
  } = useRuntimeConfig();

  if (!apiBaseUrl) {
    throw new Error('NUXT_PUBLIC_API_BASE_URL is required to create the Eden client.');
  }

  const api = createApiClient<AdminApp>(apiBaseUrl, client => client.auth.refresh.post());

  return {
    provide: {
      api,
    },
  };
});

export type AdminApi = Treaty.Create<AdminApp>;
