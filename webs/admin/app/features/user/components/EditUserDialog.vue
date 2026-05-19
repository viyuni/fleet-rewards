<script setup lang="ts">
import { UsernameSchema } from '@internal/shared/common';
import { UserUpdateSchema, type UpdateUserBody } from '@internal/shared/user';
import { useForm } from '@tanstack/vue-form';
import { Button } from '@web/ui/components/ui/button';
import { Loader2 } from 'lucide-vue-next';

import { useUpdateUser } from '../mutations';
import type { User } from '../types';

const props = defineProps<{
  user: User;
}>();

const open = defineModel<boolean>('open', { default: false });

const { mutateAsync: updateUser, isLoading } = useUpdateUser();

function createDefaultValues(user: User): UpdateUserBody {
  return {
    username: user.username,
    email: user.email ?? undefined,
    phone: user.phone ?? undefined,
    address: user.address ?? undefined,
  };
}

const form = useForm({
  validators: {
    onSubmit: UserUpdateSchema,
  },
  defaultValues: createDefaultValues(props.user),
  async onSubmit({ value }: { value: UpdateUserBody }) {
    await updateUser({
      userId: props.user.id,
      body: value,
    });

    form.reset(createDefaultValues(props.user));
    open.value = false;
  },
});

watch(
  () => props.user,
  user => {
    form.reset(createDefaultValues(user));
  },
);

watch(open, isOpen => {
  if (!isOpen) {
    form.reset(createDefaultValues(props.user));
  }
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>编辑用户</DialogTitle>
        <DialogDescription>更新用户基础资料。</DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="form.handleSubmit">
        <Field>
          <FieldLabel>UID</FieldLabel>
          <Input :model-value="user.biliUid" disabled />
        </Field>

        <form.Field
          name="username"
          :validators="{ onSubmit: UsernameSchema, onChange: UsernameSchema }"
          #default="{ field }"
        >
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">用户名</FieldLabel>
            <Input
              :id="field.name"
              :model-value="field.state.value"
              :aria-invalid="field.state.meta.errors.length > 0"
              placeholder="3-32 位用户名"
              @blur="field.handleBlur"
              @input="field.handleChange($event.target.value)"
            />
            <FieldError :errors="field.state.meta.errors" />
          </Field>
        </form.Field>

        <form.Field name="email" #default="{ field }">
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">邮箱</FieldLabel>
            <Input
              :id="field.name"
              :model-value="field.state.value ?? ''"
              :aria-invalid="field.state.meta.errors.length > 0"
              type="email"
              placeholder="可选"
              @blur="field.handleBlur"
              @input="field.handleChange($event.target.value)"
            />
            <FieldError :errors="field.state.meta.errors" />
          </Field>
        </form.Field>

        <form.Field name="phone" #default="{ field }">
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">手机号</FieldLabel>
            <Input
              :id="field.name"
              :model-value="field.state.value ?? ''"
              :aria-invalid="field.state.meta.errors.length > 0"
              placeholder="可选"
              @blur="field.handleBlur"
              @input="field.handleChange($event.target.value)"
            />
            <FieldError :errors="field.state.meta.errors" />
          </Field>
        </form.Field>

        <form.Field name="address" #default="{ field }">
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">收货地址</FieldLabel>
            <Input
              :id="field.name"
              :model-value="field.state.value ?? ''"
              :aria-invalid="field.state.meta.errors.length > 0"
              placeholder="可选"
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
