<script setup lang="ts">
import { UserUpdateSchema } from '@internal/shared/user';
import { Button } from '@web/ui/components/ui/button';
import { FormFieldItem, useForm } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

const props = defineProps<{
  user: any;
}>();

const open = defineModel<boolean>('open', { required: true });

const emit = defineEmits<{
  saved: [user: any];
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
  schema: UserUpdateSchema,
  resetOnSuccess: false,
  initialValues: () => ({
    username: props.user?.username ?? '',
    email: props.user?.email || undefined,
    phone: props.user?.phone || undefined,
    address: props.user?.address || undefined,
  }),
  async transform(values) {
    return $api.me
      .put({
        username: values.username?.trim() || undefined,
        email: values.email || undefined,
        phone: values.phone || undefined,
        address: values.address || undefined,
      })
      .then(res => res.data);
  },
});

onSubmitSuccess(user => {
  open.value = false;
  toast.success('个人信息已更新');
  emit('saved', user);
});

const onSubmit = async (event: Event) => {
  try {
    await handleSubmit(event);
  } catch (error) {
    toast.error(getErrorMessage(error, '保存失败'));
  }
};

watch([open, () => props.user], ([isOpen]) => {
  if (isOpen) {
    resetForm();
  }
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>个人信息</DialogTitle>
        <DialogDescription>查看并编辑收货联系方式。</DialogDescription>
      </DialogHeader>

      <form class="grid gap-3" @submit="onSubmit">
        <FormFieldItem v-slot="{ componentField }" name="username" label="用户名">
          <Input v-bind="componentField" />
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
          <Button type="submit" class="w-full" :disabled="!canSubmit || isSubmitting">
            <Loader2 v-if="isSubmitting" class="animate-spin" />
            保存
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
