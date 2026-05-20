<script setup lang="ts">
import { AdminUpdatePasswordSchema, type AdminUpdatePasswordBody } from '@internal/shared/admin';
import { toTypedSchema } from '@vee-validate/valibot';
import { Button } from '@web/ui/components/ui/button';
import { FormField } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';
import { useForm } from 'vee-validate';

import { useUpdateCurrentAdminPassword } from '../mutations';

const open = defineModel<boolean>('open', { default: false });

const { mutateAsync: updateCurrentAdminPassword, isLoading } = useUpdateCurrentAdminPassword();

const defaultValues: AdminUpdatePasswordBody = {
  oldPassword: '',
  newPassword: '',
};

const formSchema = toTypedSchema(AdminUpdatePasswordSchema);

const { handleSubmit, meta, resetForm } = useForm<AdminUpdatePasswordBody>({
  validationSchema: formSchema,
  initialValues: defaultValues,
});

const onSubmit = handleSubmit(async values => {
  await updateCurrentAdminPassword(values);
  resetForm();
  open.value = false;
});

watch(open, isOpen => {
  if (!isOpen) {
    resetForm();
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

      <form class="space-y-4" @submit="onSubmit">
        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="oldPassword">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>当前密码</FieldLabel>
            <Input
              v-bind="field"
              :model-value="field.value ?? ''"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              type="password"
              autocomplete="current-password"
            />

            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="newPassword">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>新密码</FieldLabel>
            <Input
              v-bind="field"
              :model-value="field.value ?? ''"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              type="password"
              autocomplete="new-password"
            />

            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline" type="button">取消</Button>
          </DialogClose>
          <Button type="submit" :disabled="isLoading || !meta.valid">
            <Loader2 v-if="isLoading" class="animate-spin" />
            保存
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
