import tailwindcss from '@tailwindcss/vite';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  app: {
    head: {
      title: 'Viyuni - Guard Rewards',
      htmlAttrs: {
        class: 'dark',
      },
      meta: [
        { charset: 'UTF-8' },
        { name: 'color-scheme', content: 'light dark' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      ],
      link: [{ rel: 'icon', href: 'https://assets.viyuni.top/viyuni.svg' }],
    },
  },

  ssr: false,

  devtools: {
    enabled: true,
  },

  nitro: {
    preset: 'static',
  },

  css: ['~/assets/main.css'],

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: [
        '@elysia/eden',
        'clsx',
        'tailwind-merge',
        '@tanstack/vue-form',
        '@vueuse/core',
        'class-variance-authority',
        'reka-ui',
        'valibot',
        'vue-sonner',
      ],
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
