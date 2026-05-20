<script setup lang="ts">
import { AdminUpdateSchema, type AdminUpdateBody } from '@internal/shared/admin';
import { toTypedSchema } from '@vee-validate/valibot';
import { Button } from '@web/ui/components/ui/button';
import { FormField } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';
import { useForm } from 'vee-validate';

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

const formSchema = toTypedSchema(AdminUpdateSchema);

const { handleSubmit, meta, resetForm } = useForm<AdminUpdateBody>({
  validationSchema: formSchema,
  initialValues: createDefaultValues(),
});

const onSubmit = handleSubmit(async values => {
  await updateCurrentAdmin({
    username: values.username?.trim() || undefined,
  });

  open.value = false;
});

watch(open, isOpen => {
  if (isOpen) {
    resetForm({ values: createDefaultValues() });
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
