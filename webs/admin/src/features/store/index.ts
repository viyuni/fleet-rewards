import type { Treaty } from '@elysia/eden';

import type { api } from '#eden';

export type AuthUserData = Treaty.Data<typeof api.auth.login.post>;

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUserData | null>(null);

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
