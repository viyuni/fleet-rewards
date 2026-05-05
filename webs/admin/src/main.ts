import { EdenFetchError } from '@elysia/eden';
import { PiniaColada } from '@pinia/colada';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import { toast } from 'vue-sonner';

import App from './App.vue';

import 'vue-sonner/style.css';
import './style.css';
import router from './router';

const app = createApp(App);

app.use(createPinia());

app.use(PiniaColada, {
  mutationOptions: {
    onError(error, _vars, context) {
      if (error instanceof EdenFetchError && context.entry.meta.showToast) {
        toast.error(error.value.message);
      } else if (error instanceof Error && context.entry.meta.showToast) {
        toast.error(error.message);
      } else {
        // somebody threw something that isn't an Error
        console.error('Unexpected error:', error);
      }
    },
  },
});

app.use(router);

app.mount('#app');
