import { treaty } from '@elysia/eden';
import type { UserApp } from '@server/app';

import { defineNuxtPlugin, useRuntimeConfig } from '#app';

function createUserApi(apiBaseUrl: string) {
  return treaty<UserApp>(apiBaseUrl, {
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

  const api = createUserApi(apiBaseUrl);

  return {
    provide: {
      api,
    },
  };
});

export type UserApi = ReturnType<typeof createUserApi>;
