// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  extends: ['../base'],

  nitro: {
    preset: 'bun',
  },

  routeRules: {
    '/': {
      // swr: 60,
    },
  },
});
