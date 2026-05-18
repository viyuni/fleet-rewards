import type { Treaty } from '@elysia/eden';
import { useLocalStorage } from '@vueuse/core';

import type { AdminApi } from '~/plugins/api';

export type AuthUserData = Treaty.Data<AdminApi['auth']['login']['post']>;

export const useAuthStore = defineStore('auth', () => {
  const user = useLocalStorage<AuthUserData | null>('user', null, {
    serializer: {
      read: value => JSON.parse(value),
      write: value => JSON.stringify(value),
    },
  });

  function updateUser(data: AuthUserData) {
    user.value = data;
  }

  function clearUser() {
    user.value = null;
  }

  return {
    user: computed(() => user.value),
    updateUser,
    clearUser,
  };
});
