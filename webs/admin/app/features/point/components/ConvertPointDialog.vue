<script setup lang="ts">
import { ConvertPointSchema, type ConvertPointBody } from '@internal/shared/point-conversion';
import { toTypedSchema } from '@vee-validate/valibot';
import { Button } from '@web/ui/components/ui/button';
import { FormField } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';
import { useForm } from 'vee-validate';

import UserSelect from '../../user/components/UserSelect.vue';
import { useConvertPoint } from '../mutations';
import type { PointConversion } from './PointConversionListView.vue';

const props = defineProps<{
  conversion: PointConversion;
}>();

const open = defineModel<boolean>('open', { default: false });

const { mutateAsync: convertPoint, isLoading } = useConvertPoint();
const userSelect = ref<InstanceType<typeof UserSelect>>();

const fromPointTypeName = computed(
  () =>
    props.conversion.fromPointTypeName ??
    props.conversion.fromPointType?.name ??
    props.conversion.fromPointTypeId,
);
const toPointTypeName = computed(
  () =>
    props.conversion.toPointTypeName ??
    props.conversion.toPointType?.name ??
    props.conversion.toPointTypeId,
);

function createDefaultValues(ruleId: string): ConvertPointBody {
  return {
    ruleId,
    userId: '',
    fromAmount: props.conversion.minConvertAmount ?? 1,
    remark: undefined,
    nonce: crypto.randomUUID(),
  };
}

const formSchema = toTypedSchema(ConvertPointSchema);

const { handleSubmit, meta, resetForm } = useForm<ConvertPointBody>({
  validationSchema: formSchema,
  initialValues: createDefaultValues(props.conversion.id),
});

const onSubmit = handleSubmit(async values => {
  await convertPoint({
    ...values,
    ruleId: props.conversion.id,
    nonce: crypto.randomUUID(),
  });

  resetForm({ values: createDefaultValues(props.conversion.id) });
  open.value = false;
});

watch(
  () => props.conversion.id,
  ruleId => {
    resetForm({ values: createDefaultValues(ruleId) });
  },
);

watch(open, isOpen => {
  if (!isOpen) {
    resetForm({ values: createDefaultValues(props.conversion.id) });
    userSelect.value?.reset();
  }
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>执行积分转换</DialogTitle>
        <DialogDescription>
          {{ conversion.name }}：1 个 {{ fromPointTypeName }} 转换为 {{ conversion.toAmount }} 个
          {{ toPointTypeName }}。
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit="onSubmit">
        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="userId">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>用户 ID</FieldLabel>
            <UserSelect
              ref="userSelect"
              :model-value="field.value"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              @update:model-value="field.onChange($event)"
              @blur="field.onBlur"
            />

            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="fromAmount">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>{{ `${fromPointTypeName}数量` }}</FieldLabel>
            <Input
              :model-value="field.value"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              type="number"
              min="1"
              step="1"
              @blur="field.onBlur"
              @input="field.onChange(Number($event.target.value))"
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
            执行转换
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
