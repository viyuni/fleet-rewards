import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import uiResolver from '@web/ui/resolver';
import autoImport from 'unplugin-auto-import/vite';
import components from 'unplugin-vue-components/vite';
import vueDevTools from 'vite-plugin-vue-devtools';
import { defineConfig } from 'vite-plus';
import vueJsxVapor from 'vue-jsx-vapor/vite';
import vueRouter from 'vue-router/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vueRouter({
      dts: './.types/typed-router.d.ts',
    }),
    vue(),
    vueJsxVapor({
      macros: true,
      interop: true,
    }),
    vueDevTools(),
    tailwindcss(),
    components({
      dts: './.types/components.d.ts',
      dirs: ['src/components', 'src/layouts'],
      resolvers: [uiResolver()],
    }),
    autoImport({
      imports: [
        'vue',
        'vue-router',
        'pinia',
        {
          from: 'vue-sonner',
          imports: ['toast'],
        },
        {
          from: '@pinia/colada',
          imports: [
            'defineMutation',
            'defineQuery',
            'defineQueryOptions',
            'useQuery',
            'useMutation',
            'useInfiniteQuery',
          ],
        },
      ],
      dts: './.types/auto-imports.d.ts',
    }),
  ],
  resolve: {
    alias: {
      '#web/admin': '/src',
      '#ui': fileURLToPath(new URL('../ui/src', import.meta.url)),
    },
  },
});
