<script setup lang="ts">
import { UserUpdateSchema, type UpdateUserBody } from '@internal/shared/user';
import { toTypedSchema } from '@vee-validate/valibot';
import { Button } from '@web/ui/components/ui/button';
import { Loader2 } from 'lucide-vue-next';
import { useForm } from 'vee-validate';

import { useUpdateUser } from '../mutations';
import type { User } from '../types';
import UserProfileFields from './UserProfileFields.vue';

const props = defineProps<{
  user: User;
}>();

const open = defineModel<boolean>('open', { default: false });

const { mutateAsync: updateUser, isLoading } = useUpdateUser();

function createDefaultValues(user: User): UpdateUserBody {
  return {
    username: user.username,
    email: user.email ?? undefined,
    phone: user.phone ?? undefined,
    address: user.address ?? undefined,
  };
}

const formSchema = toTypedSchema(UserUpdateSchema);

const { handleSubmit, meta, resetForm } = useForm<UpdateUserBody>({
  validationSchema: formSchema,
  initialValues: createDefaultValues(props.user),
});

const onSubmit = handleSubmit(async values => {
  await updateUser({
    userId: props.user.id,
    body: values,
  });

  resetForm({ values: createDefaultValues(props.user) });
  open.value = false;
});

watch(
  () => props.user,
  user => {
    resetForm({ values: createDefaultValues(user) });
  },
);

watch(open, isOpen => {
  if (!isOpen) {
    resetForm({ values: createDefaultValues(props.user) });
  }
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>编辑用户</DialogTitle>
        <DialogDescription>更新用户基础资料。</DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit="onSubmit">
        <Field>
          <FieldLabel>UID</FieldLabel>
          <Input :model-value="user.biliUid" disabled />
        </Field>

        <UserProfileFields />

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
