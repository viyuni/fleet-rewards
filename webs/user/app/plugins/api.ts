import { createApi } from '~/libs/api';

export default defineNuxtPlugin(() => {
  const {
    public: { apiBaseUrl },
  } = useRuntimeConfig();

  if (!apiBaseUrl) {
    throw new Error('NUXT_PUBLIC_API_BASE_URL is required to create the Eden client.');
  }

  return {
    provide: {
      api: createApi(apiBaseUrl),
    },
  };
});
