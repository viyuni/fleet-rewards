import tailwindcss from '@tailwindcss/vite';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL ?? process.env.VITE_SERVER_BASE_URL,
    },
  },

  devtools: {
    enabled: true,
  },

  nitro: {
    preset: 'bun',
  },

  css: ['~/assets/main.css'],

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['@elysia/eden'],
    },
  },

  experimental: {
    viteEnvironmentApi: true,
  },

  modules: ['@web/ui/nuxt', '@pinia/nuxt', '@pinia/colada-nuxt'],

  routeRules: {
    '/': {
      // swr: 60,
    },
  },
});
