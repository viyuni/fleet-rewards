<script setup lang="ts">
import { SuperAdminUpdateSchema, type SuperAdminUpdateBody } from '@internal/shared/admin';
import { toTypedSchema } from '@vee-validate/valibot';
import { Button } from '@web/ui/components/ui/button';
import { FormField } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';
import { useForm } from 'vee-validate';

import { useUpdateAdmin } from '../mutations';
import type { Admin } from './AdminListView.vue';

const props = defineProps<{
  admin: Admin;
}>();

const open = defineModel<boolean>('open', { default: false });

const { mutateAsync: updateAdmin, isLoading } = useUpdateAdmin();

function createDefaultValues(admin: Admin): SuperAdminUpdateBody {
  return {
    username: admin.username,
    remark: admin.remark ?? undefined,
  };
}

const formSchema = toTypedSchema(SuperAdminUpdateSchema);

const { handleSubmit, meta, resetForm } = useForm<SuperAdminUpdateBody>({
  validationSchema: formSchema,
  initialValues: createDefaultValues(props.admin),
});

const onSubmit = handleSubmit(async values => {
  await updateAdmin({
    adminId: props.admin.id,
    body: values,
  });

  resetForm({ values: createDefaultValues(props.admin) });
  open.value = false;
});

watch(
  () => props.admin,
  admin => {
    resetForm({ values: createDefaultValues(admin) });
  },
);

watch(open, isOpen => {
  if (!isOpen) {
    resetForm({ values: createDefaultValues(props.admin) });
  }
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>编辑管理员</DialogTitle>
        <DialogDescription>更新管理员资料。</DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit="onSubmit">
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
            保存
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
