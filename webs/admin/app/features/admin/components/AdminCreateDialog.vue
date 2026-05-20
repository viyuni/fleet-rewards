<script setup lang="ts">
import { AdminCreateSchema, type AdminCreateBody } from '@internal/shared/admin';
import { toTypedSchema } from '@vee-validate/valibot';
import { Button } from '@web/ui/components/ui/button';
import { FormField } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';
import { useForm } from 'vee-validate';

import { useCreateAdmin } from '../mutations';

const open = defineModel<boolean>('open', { default: false });

const { mutateAsync: createAdmin, isLoading } = useCreateAdmin();

function createDefaultValues(): AdminCreateBody {
  return {
    uid: '',
    username: '',
    password: '',
    remark: undefined,
  };
}

const formSchema = toTypedSchema(AdminCreateSchema);

const { handleSubmit, meta, resetForm } = useForm<AdminCreateBody>({
  validationSchema: formSchema,
  initialValues: createDefaultValues(),
});

const onSubmit = handleSubmit(async values => {
  await createAdmin(values);

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
        <DialogTitle>添加管理员</DialogTitle>
        <DialogDescription>创建普通管理员账号。</DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit="onSubmit">
        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="uid">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>UID</FieldLabel>
            <Input
              v-bind="field"
              :model-value="field.value ?? ''"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              inputmode="numeric"
            />

            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="username">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>用户名</FieldLabel>
            <Input
              v-bind="field"
              :model-value="field.value ?? ''"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
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
            />

            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="remark">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>备注</FieldLabel>
            <Textarea
              v-bind="field"
              :model-value="field.value ?? ''"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              placeholder="可选"
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
            创建
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
