import { EdenFetchError } from '@elysia/eden';
import { PiniaColada } from '@pinia/colada';
import { createPinia } from 'pinia';
import { createApp, vaporInteropPlugin } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { routes, handleHotUpdate } from 'vue-router/auto-routes';

import 'vue-sonner/style.css';
import './style.css';
import { toast } from 'vue-sonner';

import App from './App.vue';

const pinia = createPinia();
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

const app = createApp(App);

app.use(vaporInteropPlugin);
app.use(router);
app.use(pinia);
app.use(PiniaColada, {
  mutationOptions: {
    onError(error, _vars, context) {
      const { showToast, errorMessage } = context.entry.meta;

      if (!showToast) {
        // somebody threw something that isn't an Error
        console.error('Unexpected error:', error);
        return;
      }

      if (error instanceof EdenFetchError) {
        if (errorMessage) {
          toast.error(errorMessage);
          return;
        }

        if (typeof error.value === 'string') {
          toast.error(error.value);
        }

        toast.error('请求失败喵😒');
      } else if (error instanceof Error) {
        toast.error(errorMessage ?? error.message);
      } else {
        toast.error(errorMessage ?? 'Unknown error');
      }
    },

    onSuccess(_data, _variables, context) {
      const { showToast, successMessage } = context.entry.meta;

      if (showToast) {
        toast.success(successMessage ?? 'Success');
      }
    },
  },
});

app.mount('#app');

if (import.meta.hot) {
  handleHotUpdate(router);
}
