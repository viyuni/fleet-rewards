import { createApi } from '~/libs/api';

export default defineNuxtPlugin(() => {
  const {
    public: { serverBaseUrl },
  } = useRuntimeConfig();

  if (!serverBaseUrl) {
    throw new Error('NUXT_PUBLIC_SERVER_BASE_URL is required to create the Eden client.');
  }

  return {
    provide: {
      api: createApi(serverBaseUrl),
    },
  };
});
