import type { AdminLoginBody } from '@internal/shared/admin';
import { defineMutation, useMutation } from '@pinia/colada';

import { useAuthStore } from '../store';

export const useLogin = defineMutation(() => {
  const { updateSession } = useAuthStore();
  const route = useRoute();
  const router = useRouter();
  const { $api } = useNuxtApp();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '登录成功',
    },
    mutation(body: AdminLoginBody) {
      return $api.auth.login.post(body);
    },
    onSuccess({ data }) {
      if (data) {
        updateSession(data);
        const redirect =
          typeof route.query.redirect === 'string' ? route.query.redirect : '/app/users';
        router.push(redirect);
      }
    },
  });
});
