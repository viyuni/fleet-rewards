import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  // ssr: false,
  devtools: { enabled: true },

  nitro: {
    preset: 'bun',
  },

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['@elysia/eden', 'class-variance-authority', 'clsx', 'reka-ui', 'tailwind-merge'],
    },
  },

  experimental: {
    viteEnvironmentApi: true,
  },

  modules: ['@pinia/nuxt', '@pinia/colada-nuxt'],

  routeRules: {
    '/': {
      // swr: 60,
    },
  },

  alias: {
    '#ui': fileURLToPath(new URL('../ui/src', import.meta.url)),
  },
});
