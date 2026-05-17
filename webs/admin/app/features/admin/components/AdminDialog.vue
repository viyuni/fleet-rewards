<script setup lang="ts">
import type { AdminCreateBody, SuperAdminUpdateBody } from '@internal/shared/admin';
import { useForm } from '@tanstack/vue-form';
import { Button } from '@web/ui/components/ui/button';
import { Loader2 } from 'lucide-vue-next';

import { useCreateAdmin, useUpdateAdmin } from '../mutations';
import type { Admin } from './AdminListView.vue';

const props = defineProps<{
  admin?: Admin;
}>();

const open = defineModel<boolean>('open', { default: false });

const { mutateAsync: createAdmin, isLoading: isCreating } = useCreateAdmin();
const { mutateAsync: updateAdmin, isLoading: isUpdating } = useUpdateAdmin();

const isEditing = computed(() => Boolean(props.admin));
const isLoading = computed(() => isCreating.value || isUpdating.value);

function optionalText(value: string) {
  const trimmed = value.trim();

  return trimmed || undefined;
}

function createDefaultValues(admin?: Admin): AdminCreateBody {
  return {
    uid: admin?.uid ?? '',
    username: admin?.username ?? '',
    password: '',
    remark: admin?.remark ?? undefined,
  };
}

const form = useForm({
  defaultValues: createDefaultValues(props.admin),
  async onSubmit({ value }: { value: AdminCreateBody }) {
    if (props.admin) {
      await updateAdmin({
        adminId: props.admin.id,
        body: {
          username: value.username,
          remark: value.remark,
        } satisfies SuperAdminUpdateBody,
      });
    } else {
      await createAdmin(value);
    }

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
        <DialogTitle>{{ isEditing ? '编辑管理员' : '添加管理员' }}</DialogTitle>
        <DialogDescription>
          {{ isEditing ? '更新管理员资料。' : '创建普通管理员账号。' }}
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="form.handleSubmit">
        <form.Field name="uid" #default="{ field }">
          <FieldControl :field="field" label="UID" v-slot="{ id, invalid }">
            <Input
              :id="id"
              :model-value="field.state.value"
              :aria-invalid="invalid"
              :disabled="isEditing"
              inputmode="numeric"
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
              @blur="field.handleBlur"
              @input="field.handleChange($event.target.value)"
            />
          </FieldControl>
        </form.Field>

        <form.Field v-if="!isEditing" name="password" #default="{ field }">
          <FieldControl :field="field" label="初始密码" v-slot="{ id, invalid }">
            <Input
              :id="id"
              :model-value="field.state.value"
              :aria-invalid="invalid"
              type="password"
              @blur="field.handleBlur"
              @input="field.handleChange($event.target.value)"
            />
          </FieldControl>
        </form.Field>

        <form.Field name="remark" #default="{ field }">
          <FieldControl :field="field" label="备注" v-slot="{ id, invalid }">
            <Textarea
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
            {{ isEditing ? '保存' : '创建' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
