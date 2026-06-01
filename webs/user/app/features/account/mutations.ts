import type { UpdateUserBody, UserLoginBody, UserSelfRegisterBody } from '@internal/shared/user';
import { defineMutation, useMutation } from '@pinia/colada';

export const useLogin = defineMutation(() => {
  const { $api } = useNuxtApp();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '登录成功',
    },
    mutation(body: UserLoginBody) {
      return $api.auth.login.post(body);
    },
  });
});

export const useRegister = defineMutation(() => {
  const { $api } = useNuxtApp();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '注册成功',
    },
    async mutation(body: UserSelfRegisterBody) {
      await $api.auth.register.post(body);

      return $api.auth.login.post({
        biliUid: body.biliUid,
        password: body.password,
      });
    },
  });
});

export const useCreateBiliRegisterCode = defineMutation(() => {
  const { $api } = useNuxtApp();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '注册码已生成',
    },
    mutation() {
      return $api.auth.biliRegisterCode.post();
    },
  });
});

export const useUpdateCurrentUser = defineMutation(() => {
  const { $api } = useNuxtApp();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '个人信息已更新',
    },
    mutation(body: UpdateUserBody) {
      return $api.me.put(body);
    },
  });
});

export const useLogout = defineMutation(() => {
  const { $api } = useNuxtApp();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '已退出登录',
    },
    mutation() {
      return $api.auth.logout.post();
    },
  });
});
