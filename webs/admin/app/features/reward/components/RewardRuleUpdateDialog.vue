<script setup lang="ts">
import {
  BiliGuardType,
  UpdateRewardRuleSchema,
  type RewardRuleCondition,
  type UpdateRewardRuleBody,
} from '@internal/shared/reward';
import { toTypedSchema } from '@vee-validate/valibot';
import { Button } from '@web/ui/components/ui/button';
import { FormField } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';
import { useForm } from 'vee-validate';

import { fromDatetimeLocalValue, toDatetimeLocalValue } from '~/utils/form';

import { pointTypeListQuery } from '../../point/queries';
import { useUpdateRewardRule } from '../mutations';
import type { RewardRule } from './RewardRuleListView.vue';

const props = defineProps<{
  rule: RewardRule;
}>();

const open = defineModel<boolean>('open', { default: false });

const guardTypeOptions = [
  { label: '总督', value: BiliGuardType.Zongdu },
  { label: '提督', value: BiliGuardType.Tidu },
  { label: '舰长', value: BiliGuardType.Jianzhang },
] as const;

const { data: pointTypes } = useQuery(pointTypeListQuery);
const { mutateAsync: updateRewardRule, isLoading } = useUpdateRewardRule();

const activePointTypes = computed(
  () => pointTypes.value?.filter(pointType => pointType.status === 'active') ?? [],
);
type RewardRuleFormValues = UpdateRewardRuleBody;

function toRewardRuleCondition(condition: RewardRule['conditions']): RewardRuleCondition {
  return {
    type: 'biliGuard',
    guardTypes: condition.guardTypes?.filter(guardType =>
      guardTypeOptions.some(option => option.value === guardType),
    ) as RewardRuleCondition['guardTypes'],
  };
}

function createDefaultValues(rule?: RewardRule): RewardRuleFormValues {
  return {
    name: rule?.name ?? '',
    description: rule?.description ?? undefined,
    conditions: rule ? toRewardRuleCondition(rule.conditions) : { type: 'biliGuard' },
    pointTypeId: rule?.pointTypeId ?? activePointTypes.value[0]?.id ?? '',
    points: rule?.points ?? 1,
    enabled: rule?.enabled ?? false,
    group: rule?.group ?? undefined,
    startsAt: rule?.startsAt ? new Date(rule.startsAt).getTime() : undefined,
    endsAt: rule?.endsAt ? new Date(rule.endsAt).getTime() : undefined,
    priority: rule?.priority ?? 0,
  };
}

function toggleGuardType(
  field: {
    value?: UpdateRewardRuleBody['conditions'];
    onChange: (value: NonNullable<UpdateRewardRuleBody['conditions']>) => void;
  },
  guardType: BiliGuardType,
  checked: boolean,
) {
  const current = field.value?.guardTypes ?? [];
  const guardTypes = checked
    ? [...new Set([...current, guardType])]
    : current.filter(item => item !== guardType);

  field.onChange({
    type: 'biliGuard',
    guardTypes: guardTypes.length > 0 ? guardTypes : undefined,
  });
}

const formSchema = toTypedSchema(UpdateRewardRuleSchema);

const { handleSubmit, meta, resetForm } = useForm<RewardRuleFormValues>({
  validationSchema: formSchema,
  initialValues: createDefaultValues(props.rule),
});

const onSubmit = handleSubmit(async values => {
  await updateRewardRule({
    rewardRuleId: props.rule.id,
    body: values,
  });

  resetForm({ values: createDefaultValues(props.rule) });
  open.value = false;
});

watch(
  () => props.rule,
  rule => {
    resetForm({ values: createDefaultValues(rule) });
  },
);

watch(open, isOpen => {
  if (!isOpen) {
    resetForm({ values: createDefaultValues(props.rule) });
  }
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>编辑积分规则</DialogTitle>
        <DialogDescription>更新大航海事件的积分发放规则。</DialogDescription>
      </DialogHeader>

      <form class="grid gap-4 sm:grid-cols-2" @submit="onSubmit">
        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="name">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>规则名称</FieldLabel>
            <Input
              v-bind="field"
              :model-value="field.value ?? ''"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              placeholder="例如：舰长月度奖励"
            />

            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="pointTypeId">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>积分类型</FieldLabel>
            <NativeSelect
              :model-value="field.value"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              @blur="field.onBlur"
              @update:model-value="field.onChange(String($event))"
            >
              <NativeSelectOption value="" disabled>选择积分类型</NativeSelectOption>
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

        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="points">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>奖励积分</FieldLabel>
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

        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="priority">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>优先级</FieldLabel>
            <Input
              :model-value="field.value ?? 0"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              type="number"
              step="1"
              @blur="field.onBlur"
              @input="field.onChange(Number($event.target.value))"
            />

            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="group">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>互斥分组</FieldLabel>
            <Input
              v-bind="field"
              :model-value="field.value ?? ''"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              placeholder="可选"
            />

            <FieldDescription>同一分组内只取优先级最高的一条。</FieldDescription>
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

        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="conditions">
          <Field class="sm:col-span-2" :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>大航海类型</FieldLabel>
            <div class="flex flex-wrap gap-4">
              <label
                v-for="option in guardTypeOptions"
                :key="option.value"
                class="flex items-center gap-2 text-sm"
              >
                <Checkbox
                  :model-value="field.value?.guardTypes?.includes(option.value) ?? false"
                  @update:model-value="toggleGuardType(field, option.value, Boolean($event))"
                />
                {{ option.label }}
              </label>
            </div>

            <FieldDescription>不选择时匹配全部大航海类型。</FieldDescription>
            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="description">
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
          <Button
            type="submit"
            :disabled="isLoading || activePointTypes.length === 0 || !meta.valid"
          >
            <Loader2 v-if="isLoading" class="animate-spin" />
            保存
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
