<script setup lang="ts">
import type { AdminUpdateBody } from '@internal/shared/admin';
import { useForm } from '@tanstack/vue-form';
import { Button } from '@web/ui/components/ui/button';
import { Loader2 } from 'lucide-vue-next';

import { useAuthStore } from '../../auth/store';
import { useUpdateCurrentAdmin } from '../mutations';

const open = defineModel<boolean>('open', { default: false });

const { user } = storeToRefs(useAuthStore());
const { mutateAsync: updateCurrentAdmin, isLoading } = useUpdateCurrentAdmin();

function createDefaultValues(): AdminUpdateBody {
  return {
    username: user.value?.username ?? '',
  };
}

const form = useForm({
  defaultValues: createDefaultValues(),
  async onSubmit({ value }: { value: AdminUpdateBody }) {
    await updateCurrentAdmin({
      username: value.username?.trim() || undefined,
    });

    open.value = false;
  },
});

watch(open, isOpen => {
  if (isOpen) {
    form.reset(createDefaultValues());
  }
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>修改账户信息</DialogTitle>
        <DialogDescription>更新当前登录管理员的展示信息。</DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="form.handleSubmit">
        <form.Field name="username" #default="{ field }">
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">用户名</FieldLabel>
            <Input
              :id="field.name"
              :model-value="field.state.value"
              :aria-invalid="field.state.meta.errors.length > 0"
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
