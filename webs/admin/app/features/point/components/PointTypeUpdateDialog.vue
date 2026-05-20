<script setup lang="ts">
import { UpdatePointTypeSchema, type UpdatePointTypeBody } from '@internal/shared/point-type';
import { toTypedSchema } from '@vee-validate/valibot';
import { Button } from '@web/ui/components/ui/button';
import { FormField } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';
import { useForm } from 'vee-validate';

import { useUpdatePointType } from '../mutations';
import type { PointType } from './PointTypeListView.vue';

const props = defineProps<{
  pointType: PointType;
}>();

const open = defineModel<boolean>('open', { default: false });

const { mutateAsync: updatePointType, isLoading } = useUpdatePointType();

function createDefaultValues(pointType: PointType): UpdatePointTypeBody {
  return {
    name: pointType?.name ?? '',
    description: pointType?.description ?? undefined,
  };
}

const formSchema = toTypedSchema(UpdatePointTypeSchema);

const { handleSubmit, meta, resetForm } = useForm<UpdatePointTypeBody>({
  validationSchema: formSchema,
  initialValues: createDefaultValues(props.pointType),
});

const onSubmit = handleSubmit(async values => {
  await updatePointType({
    pointTypeId: props.pointType.id,
    body: values,
  });

  resetForm({ values: createDefaultValues(props.pointType) });
  open.value = false;
});

watch(
  () => props.pointType,
  pointType => {
    resetForm({ values: createDefaultValues(pointType) });
  },
);

watch(open, isOpen => {
  if (!isOpen) {
    resetForm({ values: createDefaultValues(props.pointType) });
  }
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>编辑积分类型</DialogTitle>
        <DialogDescription>更新积分类型的展示信息。</DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit="onSubmit">
        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="name">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>名称</FieldLabel>
            <Input
              v-bind="field"
              :model-value="field.value ?? ''"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              placeholder="例如：舰队积分"
            />

            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="description">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>描述</FieldLabel>
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
