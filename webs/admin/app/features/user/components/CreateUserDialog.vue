<script setup lang="ts">
import { UserRegisterSchema, type UserRegisterBody } from '@internal/shared/user';
import { toTypedSchema } from '@vee-validate/valibot';
import { Button } from '@web/ui/components/ui/button';
import { FormField } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';
import { useForm } from 'vee-validate';

import { useCreateUser } from '../mutations';
import UserProfileFields from './UserProfileFields.vue';

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

const formSchema = toTypedSchema(UserRegisterSchema);

const { handleSubmit, meta, resetForm } = useForm<UserRegisterBody>({
  validationSchema: formSchema,
  initialValues: createDefaultValues(),
});

const onSubmit = handleSubmit(async values => {
  await createUser(values);

  resetForm({ values: createDefaultValues() });
  open.value = false;
});

watch(open, isOpen => {
  if (!isOpen) {
    resetForm({ values: createDefaultValues() });
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

      <form class="space-y-4" @submit="onSubmit">
        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="biliUid">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>UID</FieldLabel>
            <Input
              v-bind="field"
              :model-value="field.value ?? ''"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              inputmode="numeric"
              placeholder="例如 123456"
            />
            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="password">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>初始密码</FieldLabel>
            <Input
              v-bind="field"
              :model-value="field.value ?? ''"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              type="password"
              placeholder="12-32 位，包含字母和数字"
            />
            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <UserProfileFields />

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline" type="button">取消</Button>
          </DialogClose>
          <Button type="submit" :disabled="isLoading || !meta.valid">
            <Loader2 v-if="isLoading" class="animate-spin" />
            创建用户
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
