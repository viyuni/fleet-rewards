<script setup lang="ts">
import { BiliUidSchema, PasswordSchema, UsernameSchema } from '@internal/shared/common';
import { UserRegisterSchema, type UserRegisterBody } from '@internal/shared/user';
import { useForm } from '@tanstack/vue-form';
import { Button } from '@web/ui/components/ui/button';
import { Loader2 } from 'lucide-vue-next';

import { useCreateUser } from '../mutations';

const open = defineModel<boolean>('open', { default: false });

const { mutateAsync: createUser, isLoading } = useCreateUser();

function createDefaultValues() {
  return {
    biliUid: '',
    username: '',
    password: '',
    email: undefined,
    phone: undefined,
    address: undefined,
  } satisfies UserRegisterBody;
}

const form = useSchemaForm(UserRegisterSchema, {
  defaultValuesFn() {
    return {
      biliUid: '',
      username: '',
      password: '',
      email: undefined,
      phone: undefined,
      address: undefined,
    } satisfies UserRegisterBody;
  },
  async onSubmit({ value }) {
    await createUser(value);

    form.reset(createDefaultValues());
    open.value = false;
  },
});

watch(open, isOpen => {
  if (!isOpen) {
    form.reset(createDefaultValues());
  }
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>添加用户</DialogTitle>
        <DialogDescription>创建一个用户账号</DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="form.handleSubmit">
        <form.Field
          name="biliUid"
          :validators="{ onSubmit: BiliUidSchema, onChange: BiliUidSchema }"
          #default="{ field }"
        >
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">UID</FieldLabel>
            <Input
              :id="field.name"
              :model-value="field.state.value"
              :aria-invalid="field.state.meta.errors.length > 0"
              inputmode="numeric"
              placeholder="例如 123456"
              @blur="field.handleBlur"
              @input="field.handleChange($event.target.value)"
            />
            <FieldError :errors="field.state.meta.errors" />
          </Field>
        </form.Field>

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

        <form.Field
          name="password"
          :validators="{ onSubmit: PasswordSchema, onChange: PasswordSchema }"
          #default="{ field }"
        >
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">初始密码</FieldLabel>
            <Input
              :id="field.name"
              :model-value="field.state.value"
              :aria-invalid="field.state.meta.errors.length > 0"
              type="password"
              placeholder="12-32 位，包含字母和数字"
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
            创建用户
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
