<script setup lang="ts">
import { AdminCreateSchema, type AdminCreateBody } from '@internal/shared/admin';
import { useForm } from '@tanstack/vue-form';
import { Button } from '@web/ui/components/ui/button';
import { Loader2 } from 'lucide-vue-next';

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

const form = useForm({
  validators: {
    onSubmit: AdminCreateSchema,
  },
  defaultValues: createDefaultValues(),
  async onSubmit({ value }: { value: AdminCreateBody }) {
    await createAdmin(value);

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
        <DialogTitle>添加管理员</DialogTitle>
        <DialogDescription>创建普通管理员账号。</DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="form.handleSubmit">
        <form.Field name="uid" #default="{ field }">
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">UID</FieldLabel>
            <Input
              :id="field.name"
              :model-value="field.state.value"
              :aria-invalid="field.state.meta.errors.length > 0"
              inputmode="numeric"
              @blur="field.handleBlur"
              @input="field.handleChange($event.target.value)"
            />

            <FieldError :errors="field.state.meta.errors" />
          </Field>
        </form.Field>

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

        <form.Field name="password" #default="{ field }">
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">初始密码</FieldLabel>
            <Input
              :id="field.name"
              :model-value="field.state.value"
              :aria-invalid="field.state.meta.errors.length > 0"
              type="password"
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
            创建
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
