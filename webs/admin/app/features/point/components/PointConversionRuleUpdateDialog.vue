<script setup lang="ts">
import {
  UpdatePointConversionRuleSchema,
  type UpdatePointConversionRuleBody,
} from '@internal/shared/point-conversion';
import { toTypedSchema } from '@vee-validate/valibot';
import { Button } from '@web/ui/components/ui/button';
import { FormField } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';
import { useForm } from 'vee-validate';

import { fromDatetimeLocalValue, toDatetimeLocalValue } from '~/utils/form';

import { useUpdatePointConversionRule } from '../mutations';
import { pointTypeListQuery } from '../queries';
import type { PointConversion } from './PointConversionListView.vue';

const props = defineProps<{
  conversion: PointConversion;
}>();

const open = defineModel<boolean>('open', { default: false });

const { data: pointTypes } = useQuery(pointTypeListQuery);
const { mutateAsync: updateConversionRule, isLoading } = useUpdatePointConversionRule();

const activePointTypes = computed(
  () => pointTypes.value?.filter(pointType => pointType.status === 'active') ?? [],
);
type PointConversionRuleFormValues = UpdatePointConversionRuleBody;

function createDefaultValues(conversion?: PointConversion): PointConversionRuleFormValues {
  return {
    name: conversion?.name ?? '',
    description: conversion?.description ?? undefined,
    remark: conversion?.remark ?? undefined,
    fromPointTypeId: conversion?.fromPointTypeId ?? activePointTypes.value[0]?.id ?? '',
    toPointTypeId: conversion?.toPointTypeId ?? activePointTypes.value[1]?.id ?? '',
    toAmount: conversion?.toAmount ?? 1,
    minConvertAmount: conversion?.minConvertAmount ?? undefined,
    maxConvertAmount: conversion?.maxConvertAmount ?? undefined,
    enabled: conversion?.enabled ?? false,
    startsAt: conversion?.startsAt ? new Date(conversion.startsAt).getTime() : undefined,
    endsAt: conversion?.endsAt ? new Date(conversion.endsAt).getTime() : undefined,
  };
}

const formSchema = toTypedSchema(UpdatePointConversionRuleSchema);

const { handleSubmit, meta, resetForm } = useForm<PointConversionRuleFormValues>({
  validationSchema: formSchema,
  initialValues: createDefaultValues(props.conversion),
});

const onSubmit = handleSubmit(async values => {
  await updateConversionRule({
    pointConversionRuleId: props.conversion.id,
    body: values,
  });

  resetForm({ values: createDefaultValues(props.conversion) });
  open.value = false;
});

watch(
  () => props.conversion,
  conversion => {
    resetForm({ values: createDefaultValues(conversion) });
  },
);

watch(open, isOpen => {
  if (!isOpen) {
    resetForm({ values: createDefaultValues(props.conversion) });
  }
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>编辑积分转换</DialogTitle>
        <DialogDescription>更新积分类型之间的转换规则。</DialogDescription>
      </DialogHeader>

      <form class="grid gap-4 sm:grid-cols-2" @submit="onSubmit">
        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="name">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>规则名称</FieldLabel>
            <Input
              v-bind="field"
              :model-value="field.value ?? ''"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              placeholder="例如：督级积分兑换舰级积分"
            />

            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="toAmount">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>目标数量</FieldLabel>
            <Input
              :model-value="field.value"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              type="number"
              min="1"
              step="1"
              @blur="field.onBlur"
              @input="field.onChange(Number($event.target.value))"
            />

            <FieldDescription>每 1 个来源积分可兑换的目标积分数量。</FieldDescription>
            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="fromPointTypeId">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>来源积分</FieldLabel>
            <NativeSelect
              :model-value="field.value"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              @blur="field.onBlur"
              @update:model-value="field.onChange(String($event))"
            >
              <NativeSelectOption value="" disabled>选择来源积分</NativeSelectOption>
              <NativeSelectOption
                v-for="pointType in activePointTypes"
                :key="pointType.id"
                :value="pointType.id"
              >
                {{ pointType.name }}
              </NativeSelectOption>
            </NativeSelect>

            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="toPointTypeId">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>目标积分</FieldLabel>
            <NativeSelect
              :model-value="field.value"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              @blur="field.onBlur"
              @update:model-value="field.onChange(String($event))"
            >
              <NativeSelectOption value="" disabled>选择目标积分</NativeSelectOption>
              <NativeSelectOption
                v-for="pointType in activePointTypes"
                :key="pointType.id"
                :value="pointType.id"
              >
                {{ pointType.name }}
              </NativeSelectOption>
            </NativeSelect>

            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="minConvertAmount">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>单次最小转换</FieldLabel>
            <Input
              :model-value="field.value ?? ''"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              type="number"
              min="1"
              step="1"
              placeholder="不限制"
              @blur="field.onBlur"
              @input="field.onChange($event.target.value ? Number($event.target.value) : undefined)"
            />

            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="maxConvertAmount">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>单次最大转换</FieldLabel>
            <Input
              :model-value="field.value ?? ''"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              type="number"
              min="1"
              step="1"
              placeholder="不限制"
              @blur="field.onBlur"
              @input="field.onChange($event.target.value ? Number($event.target.value) : undefined)"
            />

            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="startsAt">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>开始时间</FieldLabel>
            <Input
              :model-value="toDatetimeLocalValue(field.value)"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              type="datetime-local"
              step="1"
              @blur="field.onBlur"
              @input="field.onChange(fromDatetimeLocalValue($event.target.value))"
            />

            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="endsAt">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>结束时间</FieldLabel>
            <Input
              :model-value="toDatetimeLocalValue(field.value)"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              type="datetime-local"
              step="1"
              @blur="field.onBlur"
              @input="field.onChange(fromDatetimeLocalValue($event.target.value))"
            />

            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="enabled">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>启用状态</FieldLabel>
            <Switch
              :model-value="field.value ?? false"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              @update:model-value="field.onChange(Boolean($event))"
            />

            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="description">
          <Field class="sm:col-span-2" :data-invalid="fieldMeta.touched && errors.length > 0">
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

        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="remark">
          <Field class="sm:col-span-2" :data-invalid="fieldMeta.touched && errors.length > 0">
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

        <DialogFooter class="sm:col-span-2">
          <DialogClose as-child>
            <Button variant="outline" type="button">取消</Button>
          </DialogClose>
          <Button type="submit" :disabled="isLoading || activePointTypes.length < 2 || !meta.valid">
            <Loader2 v-if="isLoading" class="animate-spin" />
            保存
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
