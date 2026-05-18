<script setup lang="ts">
import type {
  CreatePointConversionRuleBody,
  UpdatePointConversionRuleBody,
} from '@internal/shared/point-conversion';
import { useForm } from '@tanstack/vue-form';
import { Button } from '@web/ui/components/ui/button';
import { Loader2 } from 'lucide-vue-next';

import { fromDatetimeLocalValue, optionalText, toDatetimeLocalValue } from '~/utils/form';

import { useCreatePointConversionRule, useUpdatePointConversionRule } from '../mutations';
import { pointTypeListQuery } from '../queries';
import type { PointConversion } from './PointConversionListView.vue';

const props = defineProps<{
  conversion?: PointConversion;
}>();

const open = defineModel<boolean>('open', { default: false });

const { data: pointTypes } = useQuery(pointTypeListQuery);
const { mutateAsync: createConversionRule, isLoading: isCreating } = useCreatePointConversionRule();
const { mutateAsync: updateConversionRule, isLoading: isUpdating } = useUpdatePointConversionRule();

const activePointTypes = computed(
  () => pointTypes.value?.filter(pointType => pointType.status === 'active') ?? [],
);
const isEditing = computed(() => Boolean(props.conversion));
const isLoading = computed(() => isCreating.value || isUpdating.value);

type PointConversionRuleFormValues = Omit<CreatePointConversionRuleBody, 'endsAt' | 'startsAt'> & {
  endsAt?: number;
  startsAt?: number;
};

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

const form = useForm({
  defaultValues: createDefaultValues(props.conversion),
  async onSubmit({ value }: { value: PointConversionRuleFormValues }) {
    if (props.conversion) {
      await updateConversionRule({
        pointConversionRuleId: props.conversion.id,
        body: value as unknown as UpdatePointConversionRuleBody,
      });
    } else {
      await createConversionRule(value as unknown as CreatePointConversionRuleBody);
    }

    form.reset(createDefaultValues(props.conversion));
    open.value = false;
  },
});

watch(
  () => props.conversion,
  conversion => {
    form.reset(createDefaultValues(conversion));
  },
);

watch(open, isOpen => {
  if (!isOpen) {
    form.reset(createDefaultValues(props.conversion));
  }
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{ isEditing ? '编辑积分转换' : '添加积分转换' }}</DialogTitle>
        <DialogDescription>
          {{ isEditing ? '更新积分类型之间的转换规则。' : '创建积分类型之间的转换规则。' }}
        </DialogDescription>
      </DialogHeader>

      <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="form.handleSubmit">
        <form.Field name="name" #default="{ field }">
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">规则名称</FieldLabel>
            <Input
              :id="field.name"
              :model-value="field.state.value"
              :aria-invalid="field.state.meta.errors.length > 0"
              placeholder="例如：督级积分兑换舰级积分"
              @blur="field.handleBlur"
              @input="field.handleChange($event.target.value)"
            />

            <FieldError :errors="field.state.meta.errors" />
          </Field>
        </form.Field>

        <form.Field name="toAmount" #default="{ field }">
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">目标数量</FieldLabel>
            <Input
              :id="field.name"
              :model-value="field.state.value"
              :aria-invalid="field.state.meta.errors.length > 0"
              type="number"
              min="1"
              step="1"
              @blur="field.handleBlur"
              @input="field.handleChange(Number($event.target.value))"
            />

            <FieldDescription>每 1 个来源积分可兑换的目标积分数量。</FieldDescription>
            <FieldError :errors="field.state.meta.errors" />
          </Field>
        </form.Field>

        <form.Field name="fromPointTypeId" #default="{ field }">
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">来源积分</FieldLabel>
            <NativeSelect
              :id="field.name"
              :model-value="field.state.value"
              :aria-invalid="field.state.meta.errors.length > 0"
              @blur="field.handleBlur"
              @update:model-value="field.handleChange(String($event))"
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

            <FieldError :errors="field.state.meta.errors" />
          </Field>
        </form.Field>

        <form.Field name="toPointTypeId" #default="{ field }">
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">目标积分</FieldLabel>
            <NativeSelect
              :id="field.name"
              :model-value="field.state.value"
              :aria-invalid="field.state.meta.errors.length > 0"
              @blur="field.handleBlur"
              @update:model-value="field.handleChange(String($event))"
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

            <FieldError :errors="field.state.meta.errors" />
          </Field>
        </form.Field>

        <form.Field name="minConvertAmount" #default="{ field }">
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">单次最小转换</FieldLabel>
            <Input
              :id="field.name"
              :model-value="field.state.value ?? ''"
              :aria-invalid="field.state.meta.errors.length > 0"
              type="number"
              min="1"
              step="1"
              placeholder="不限制"
              @blur="field.handleBlur"
              @input="field.handleChange($event.target.value)"
            />

            <FieldError :errors="field.state.meta.errors" />
          </Field>
        </form.Field>

        <form.Field name="maxConvertAmount" #default="{ field }">
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">单次最大转换</FieldLabel>
            <Input
              :id="field.name"
              :model-value="field.state.value ?? ''"
              :aria-invalid="field.state.meta.errors.length > 0"
              type="number"
              min="1"
              step="1"
              placeholder="不限制"
              @blur="field.handleBlur"
              @input="field.handleChange($event.target.value)"
            />

            <FieldError :errors="field.state.meta.errors" />
          </Field>
        </form.Field>

        <form.Field name="startsAt" #default="{ field }">
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">开始时间</FieldLabel>
            <Input
              :id="field.name"
              :model-value="toDatetimeLocalValue(field.state.value)"
              :aria-invalid="field.state.meta.errors.length > 0"
              type="datetime-local"
              step="1"
              @blur="field.handleBlur"
              @input="field.handleChange(fromDatetimeLocalValue($event.target.value))"
            />

            <FieldError :errors="field.state.meta.errors" />
          </Field>
        </form.Field>

        <form.Field name="endsAt" #default="{ field }">
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">结束时间</FieldLabel>
            <Input
              :id="field.name"
              :model-value="toDatetimeLocalValue(field.state.value)"
              :aria-invalid="field.state.meta.errors.length > 0"
              type="datetime-local"
              step="1"
              @blur="field.handleBlur"
              @input="field.handleChange(fromDatetimeLocalValue($event.target.value))"
            />

            <FieldError :errors="field.state.meta.errors" />
          </Field>
        </form.Field>

        <form.Field name="enabled" #default="{ field }">
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">启用状态</FieldLabel>
            <Switch
              :model-value="field.state.value ?? false"
              :aria-invalid="field.state.meta.errors.length > 0"
              @update:model-value="field.handleChange(Boolean($event))"
            />

            <FieldError :errors="field.state.meta.errors" />
          </Field>
        </form.Field>

        <form.Field name="description" #default="{ field }">
          <Field class="sm:col-span-2" :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">描述</FieldLabel>
            <Textarea
              :id="field.name"
              :model-value="field.state.value ?? ''"
              :aria-invalid="field.state.meta.errors.length > 0"
              placeholder="可选"
              @blur="field.handleBlur"
              @input="field.handleChange(optionalText($event.target.value))"
            />

            <FieldError :errors="field.state.meta.errors" />
          </Field>
        </form.Field>

        <form.Field name="remark" #default="{ field }">
          <Field class="sm:col-span-2" :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">备注</FieldLabel>
            <Textarea
              :id="field.name"
              :model-value="field.state.value ?? ''"
              :aria-invalid="field.state.meta.errors.length > 0"
              placeholder="可选"
              @blur="field.handleBlur"
              @input="field.handleChange(optionalText($event.target.value))"
            />

            <FieldError :errors="field.state.meta.errors" />
          </Field>
        </form.Field>

        <DialogFooter class="sm:col-span-2">
          <DialogClose as-child>
            <Button variant="outline" type="button">取消</Button>
          </DialogClose>
          <Button type="submit" :disabled="isLoading || activePointTypes.length < 2">
            <Loader2 v-if="isLoading" class="animate-spin" />
            {{ isEditing ? '保存' : '创建' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
