<script setup lang="ts">
import { UserRegisterSchema, type UserRegisterBody } from '@internal/shared/user';
import { useForm } from '@tanstack/vue-form';
import { Button } from '@web/ui/components/ui/button';
import { Loader2 } from 'lucide-vue-next';

import { useCreateUser } from '../mutations';

const open = defineModel<boolean>('open', { default: false });

const { mutateAsync: createUser, isLoading } = useCreateUser();

function createDefaultValues(): UserRegisterBody {
  return {
    biliUid: '',
    username: '',
    password: '',
    email: undefined,
    phone: undefined,
    address: undefined,
  };
}

function optionalText(value: string) {
  const trimmed = value.trim();

  return trimmed || undefined;
}

const form = useForm({
  validators: {
    onSubmit: UserRegisterSchema,
  },
  defaultValues: createDefaultValues(),
  async onSubmit({ value }: { value: UserRegisterBody }) {
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
        <form.Field name="biliUid" #default="{ field }">
          <FieldControl :field="field" label="UID" v-slot="{ id, invalid }">
            <Input
              :id="id"
              :model-value="field.state.value"
              :aria-invalid="invalid"
              inputmode="numeric"
              placeholder="例如 123456"
              @blur="field.handleBlur"
              @input="field.handleChange($event.target.value)"
            />
          </FieldControl>
        </form.Field>

        <form.Field name="username" #default="{ field }">
          <FieldControl :field="field" label="用户名" v-slot="{ id, invalid }">
            <Input
              :id="id"
              :model-value="field.state.value"
              :aria-invalid="invalid"
              placeholder="3-32 位用户名"
              @blur="field.handleBlur"
              @input="field.handleChange($event.target.value)"
            />
          </FieldControl>
        </form.Field>

        <form.Field name="password" #default="{ field }">
          <FieldControl :field="field" label="初始密码" v-slot="{ id, invalid }">
            <Input
              :id="id"
              :model-value="field.state.value"
              :aria-invalid="invalid"
              type="password"
              placeholder="12-32 位，包含字母和数字"
              @blur="field.handleBlur"
              @input="field.handleChange($event.target.value)"
            />
          </FieldControl>
        </form.Field>

        <form.Field name="email" #default="{ field }">
          <FieldControl :field="field" label="邮箱" v-slot="{ id, invalid }">
            <Input
              :id="id"
              :model-value="field.state.value ?? ''"
              :aria-invalid="invalid"
              type="email"
              placeholder="可选"
              @blur="field.handleBlur"
              @input="field.handleChange(optionalText($event.target.value))"
            />
          </FieldControl>
        </form.Field>

        <form.Field name="phone" #default="{ field }">
          <FieldControl :field="field" label="手机号" v-slot="{ id, invalid }">
            <Input
              :id="id"
              :model-value="field.state.value ?? ''"
              :aria-invalid="invalid"
              placeholder="可选"
              @blur="field.handleBlur"
              @input="field.handleChange(optionalText($event.target.value))"
            />
          </FieldControl>
        </form.Field>

        <form.Field name="address" #default="{ field }">
          <FieldControl :field="field" label="收货地址" v-slot="{ id, invalid }">
            <Input
              :id="id"
              :model-value="field.state.value ?? ''"
              :aria-invalid="invalid"
              placeholder="可选"
              @blur="field.handleBlur"
              @input="field.handleChange(optionalText($event.target.value))"
            />
          </FieldControl>
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
