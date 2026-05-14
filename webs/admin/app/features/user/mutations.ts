import type { UserRegisterBody } from '@internal/shared/user';
import { defineMutation, useMutation, useQueryCache } from '@pinia/colada';

import { USER_QUERY_KEYS } from './queries';

function useInvalidateUsers() {
  const queryCache = useQueryCache();

  return () => queryCache.invalidateQueries({ key: USER_QUERY_KEYS.root });
}

export const useCreateUser = defineMutation(() => {
  const { $api } = useNuxtApp();
  const invalidateUsers = useInvalidateUsers();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '用户创建成功',
    },
    mutation(body: UserRegisterBody) {
      return $api.users.post(body);
    },
    onSettled: invalidateUsers,
  });
});

export const useBanUser = defineMutation(() => {
  const { $api } = useNuxtApp();
  const invalidateUsers = useInvalidateUsers();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '用户已封禁',
    },
    mutation(userId: string) {
      return $api.users({ userId }).ban.patch();
    },
    onSettled: invalidateUsers,
  });
});

export const useRestoreUser = defineMutation(() => {
  const { $api } = useNuxtApp();
  const invalidateUsers = useInvalidateUsers();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '用户已恢复',
    },
    mutation(userId: string) {
      return $api.users({ userId }).restore.patch();
    },
    onSettled: invalidateUsers,
  });
});
