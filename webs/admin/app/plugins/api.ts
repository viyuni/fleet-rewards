import { api } from '~/libs/api';

export default defineNuxtPlugin(() => {
  return {
    provide: {
      api,
    },
  };
});
