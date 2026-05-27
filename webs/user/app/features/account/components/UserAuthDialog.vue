<script setup lang="ts">
import { UserLoginSchema, UserRegisterSchema } from '@internal/shared/user';
import { Button } from '@web/ui/components/ui/button';
import { FormFieldItem, useForm } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

defineProps<{
  authMode: 'login' | 'register';
}>();

const open = defineModel<boolean>('open', { required: true });

const emit = defineEmits<{
  'update:authMode': [mode: 'login' | 'register'];
  authenticated: [user: any];
}>();

const { $api } = useNuxtApp();

function getErrorMessage(error: unknown, fallback = '操作失败，请稍后再试') {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return fallback;
}

const {
  canSubmit: canSubmitLogin,
  handleSubmit: handleLoginSubmit,
  isSubmitting: isSubmittingLogin,
  onSubmitSuccess: onLoginSuccess,
  resetForm: resetLoginForm,
} = useForm({
  schema: UserLoginSchema,
  resetOnSuccess: false,
  initialValues: () => ({
    biliUid: '',
    password: '',
  }),
  async transform(values) {
    return $api.auth.login.post(values).then(res => res.data);
  },
});

const {
  canSubmit: canSubmitRegister,
  handleSubmit: handleRegisterSubmit,
  isSubmitting: isSubmittingRegister,
  onSubmitSuccess: onRegisterSuccess,
  resetForm: resetRegisterForm,
} = useForm({
  schema: UserRegisterSchema,
  resetOnSuccess: false,
  initialValues: () => ({
    biliUid: '',
    username: '',
    password: '',
    email: undefined,
    phone: undefined,
    address: undefined,
  }),
  async transform(values) {
    await $api.auth.register.post({
      ...values,
      email: values.email || undefined,
      phone: values.phone || undefined,
      address: values.address || undefined,
    });

    return $api.auth.login
      .post({ biliUid: values.biliUid, password: values.password })
      .then(res => res.data);
  },
});

onLoginSuccess(user => {
  open.value = false;
  toast.success('登录成功');
  emit('authenticated', user);
});

onRegisterSuccess(user => {
  open.value = false;
  toast.success('注册成功');
  emit('authenticated', user);
});

const onLoginSubmit = async (event: Event) => {
  try {
    await handleLoginSubmit(event);
  } catch (error) {
    toast.error(getErrorMessage(error, '登录失败'));
  }
};

const onRegisterSubmit = async (event: Event) => {
  try {
    await handleRegisterSubmit(event);
  } catch (error) {
    toast.error(getErrorMessage(error, '注册失败'));
  }
};

watch(open, isOpen => {
  if (!isOpen) {
    resetLoginForm();
    resetRegisterForm();
  }
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{{ authMode === 'login' ? '登录' : '注册' }}</DialogTitle>
        <DialogDescription>使用 B 站 UID 和密码继续。</DialogDescription>
      </DialogHeader>

      <div class="grid grid-cols-2 gap-2">
        <Button
          :variant="authMode === 'login' ? 'default' : 'outline'"
          @click="emit('update:authMode', 'login')"
        >
          登录
        </Button>
        <Button
          :variant="authMode === 'register' ? 'default' : 'outline'"
          @click="emit('update:authMode', 'register')"
        >
          注册
        </Button>
      </div>

      <form v-if="authMode === 'login'" class="grid gap-3" @submit="onLoginSubmit">
        <FormFieldItem v-slot="{ componentField }" name="biliUid" label="B 站 UID" required>
          <Input v-bind="componentField" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="password" label="密码" required>
          <Input v-bind="componentField" type="password" />
        </FormFieldItem>

        <DialogFooter>
          <Button type="submit" class="w-full" :disabled="!canSubmitLogin">
            <Loader2 v-if="isSubmittingLogin" class="animate-spin" />
            登录
          </Button>
        </DialogFooter>
      </form>

      <form v-else class="grid gap-3" @submit="onRegisterSubmit">
        <FormFieldItem v-slot="{ componentField }" name="biliUid" label="B 站 UID" required>
          <Input v-bind="componentField" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="username" label="用户名" required>
          <Input v-bind="componentField" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="password" label="密码" required>
          <Input v-bind="componentField" type="password" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="email" label="邮箱">
          <Input v-bind="componentField" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="phone" label="手机">
          <Input v-bind="componentField" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="address" label="收货地址">
          <Textarea v-bind="componentField" />
        </FormFieldItem>

        <DialogFooter>
          <Button type="submit" class="w-full" :disabled="!canSubmitRegister">
            <Loader2 v-if="isSubmittingRegister" class="animate-spin" />
            注册并登录
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
