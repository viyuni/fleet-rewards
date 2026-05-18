<script setup lang="ts">
import type { AdminUpdatePasswordBody } from '@internal/shared/admin';
import { useForm } from '@tanstack/vue-form';
import { Button } from '@web/ui/components/ui/button';
import { Loader2 } from 'lucide-vue-next';

import { useUpdateCurrentAdminPassword } from '../mutations';

const open = defineModel<boolean>('open', { default: false });

const { mutateAsync: updateCurrentAdminPassword, isLoading } = useUpdateCurrentAdminPassword();

const defaultValues: AdminUpdatePasswordBody = {
  oldPassword: '',
  newPassword: '',
};

const form = useForm({
  defaultValues,
  async onSubmit({ value }: { value: AdminUpdatePasswordBody }) {
    await updateCurrentAdminPassword(value);
    form.reset();
    open.value = false;
  },
});

watch(open, isOpen => {
  if (!isOpen) {
    form.reset();
  }
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>修改账户密码</DialogTitle>
        <DialogDescription>修改后请使用新密码登录。</DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="form.handleSubmit">
        <form.Field name="oldPassword" #default="{ field }">
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">当前密码</FieldLabel>
            <Input
              :id="field.name"
              :model-value="field.state.value"
              :aria-invalid="field.state.meta.errors.length > 0"
              type="password"
              autocomplete="current-password"
              @blur="field.handleBlur"
              @input="field.handleChange($event.target.value)"
            />

            <FieldError :errors="field.state.meta.errors" />
          </Field>
        </form.Field>

        <form.Field name="newPassword" #default="{ field }">
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">新密码</FieldLabel>
            <Input
              :id="field.name"
              :model-value="field.state.value"
              :aria-invalid="field.state.meta.errors.length > 0"
              type="password"
              autocomplete="new-password"
              @blur="field.handleBlur"
              @input="field.handleChange($event.target.value)"
            />

            <FieldError :errors="field.state.meta.errors" />
          </Field>
        </form.Field>

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline" type="button">取消</Button>
          </DialogClose>
          <Button type="submit" :disabled="isLoading">
            <Loader2 v-if="isLoading" class="animate-spin" />
            保存
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
