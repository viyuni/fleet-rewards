import tailwindcss from '@tailwindcss/vite';
import vize from '@vizejs/vite-plugin';
import { defineConfig } from 'vite';
import vueDevTools from 'vite-plugin-vue-devtools';

// https://vite.dev/config/
export default defineConfig({
  plugins: [vize(), vueDevTools(), tailwindcss()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      '#web-user': '/src',
    },
  },
});
