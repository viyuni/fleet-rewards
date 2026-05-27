<script setup lang="ts">
import { UserLoginSchema } from '@internal/shared/user';
import { Button } from '@web/ui/components/ui/button';
import { FormFieldItem, useForm } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

const emit = defineEmits<{
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

const { canSubmit, handleSubmit, isSubmitting, onSubmitSuccess, resetForm } = useForm({
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

onSubmitSuccess(user => {
  toast.success('登录成功');
  emit('authenticated', user);
});

const onSubmit = async (event: Event) => {
  try {
    await handleSubmit(event);
  } catch (error) {
    toast.error(getErrorMessage(error, '登录失败'));
  }
};

defineExpose({
  resetForm,
});
</script>

<template>
  <form class="grid gap-3" @submit="onSubmit">
    <FormFieldItem v-slot="{ componentField }" name="biliUid" label="B 站 UID" required>
      <Input v-bind="componentField" />
    </FormFieldItem>

    <FormFieldItem v-slot="{ componentField }" name="password" label="密码" required>
      <Input v-bind="componentField" type="password" />
    </FormFieldItem>

    <DialogFooter>
      <Button type="submit" class="w-full" :disabled="!canSubmit">
        <Loader2 v-if="isSubmitting" class="animate-spin" />
        登录
      </Button>
    </DialogFooter>
  </form>
</template>
