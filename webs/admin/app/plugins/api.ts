import { type Treaty } from '@elysia/eden';
import type { AdminApp } from '@server/app';

import { defineNuxtPlugin, useRouter, useRuntimeConfig } from '#app';
import { createApiClient } from '#imports';
import { useAuthStore } from '~/features/auth/store';

export default defineNuxtPlugin(() => {
  const {
    public: { apiBaseUrl },
  } = useRuntimeConfig();

  const router = useRouter();
  const authStore = useAuthStore();

  if (!apiBaseUrl) {
    throw new Error('NUXT_PUBLIC_API_BASE_URL is required to create the Eden client.');
  }

  const api = createApiClient<AdminApp>({
    baseUrl: apiBaseUrl,
    authRefresh: client => client.auth.refresh.post(),
    onAuthRefreshError(error) {
      if (error.status === 401) {
        authStore.clearSession();
        return router.replace('/login');
      }
    },
  });

  return {
    provide: {
      api,
    },
  };
});

export type AdminApi = Treaty.Create<AdminApp>;
