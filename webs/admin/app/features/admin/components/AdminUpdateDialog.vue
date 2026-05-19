<script setup lang="ts">
import { SuperAdminUpdateSchema, type SuperAdminUpdateBody } from '@internal/shared/admin';
import { useForm } from '@tanstack/vue-form';
import { Button } from '@web/ui/components/ui/button';
import { Loader2 } from 'lucide-vue-next';

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

const form = useForm({
  validators: {
    onSubmit: SuperAdminUpdateSchema,
  },
  defaultValues: createDefaultValues(props.admin),
  async onSubmit({ value }: { value: SuperAdminUpdateBody }) {
    await updateAdmin({
      adminId: props.admin.id,
      body: value,
    });

    form.reset(createDefaultValues(props.admin));
    open.value = false;
  },
});

watch(
  () => props.admin,
  admin => {
    form.reset(createDefaultValues(admin));
  },
);

watch(open, isOpen => {
  if (!isOpen) {
    form.reset(createDefaultValues(props.admin));
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

        <form.Field name="remark" #default="{ field }">
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">备注</FieldLabel>
            <Textarea
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
