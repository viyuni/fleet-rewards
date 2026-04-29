import { fileURLToPath } from 'node:url';

import uiResolver from '@gr/ui/resolver';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import autoImport from 'unplugin-auto-import/vite';
import components from 'unplugin-vue-components/vite';
import vueDevTools from 'vite-plugin-vue-devtools';
import { defineConfig } from 'vite-plus';
import vueRouter from 'vue-router/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    components({
      dts: './.types/components.d.ts',
      resolvers: [uiResolver()],
    }),
    vueRouter({
      dts: './.types/typed-router.d.ts',
    }),
    vue(),
    vueDevTools(),
    tailwindcss(),
    autoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      dts: './.types/auto-imports.d.ts',
    }),
  ],
  resolve: {
    alias: {
      '#web-admin': '/src',
      '#ui': fileURLToPath(new URL('../ui/src', import.meta.url)),
    },
  },
});
