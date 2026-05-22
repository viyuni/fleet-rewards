import type { Treaty } from '@elysia/eden';
import { useLocalStorage } from '@vueuse/core';

import type { AdminApi } from '~/plugins/api';

export type AuthSessionData = Treaty.Data<AdminApi['auth']['login']['post']>;
export type AuthUserData = NonNullable<AuthSessionData>['user'];

export const useAuthStore = defineStore('auth', () => {
  const session = useLocalStorage<AuthSessionData | null>('user', null, {
    serializer: {
      read: value => JSON.parse(value),
      write: value => JSON.stringify(value),
    },
  });

  const isAuthenticated = computed(() => {
    return Boolean(session.value && session.value.refreshTokenExpiresAt > Date.now());
  });

  const user = computed(() => {
    if (!isAuthenticated.value) {
      return null;
    }

    return session.value?.user ?? null;
  });

  function updateSession(data: AuthSessionData) {
    session.value = data;
  }

  function updateUser(data: AuthUserData) {
    if (!session.value) {
      return;
    }

    session.value = {
      ...session.value,
      user: data,
    };
  }

  function clearSession() {
    session.value = null;
  }

  function clearExpiredSession() {
    if (
      session.value &&
      (typeof session.value.refreshTokenExpiresAt !== 'number' ||
        session.value.refreshTokenExpiresAt <= Date.now())
    ) {
      clearSession();
    }
  }

  return {
    user,
    isAuthenticated,
    updateSession,
    updateUser,
    clearSession,
    clearExpiredSession,
  };
});
