<script setup lang="ts">
import {
  BiliGuardType,
  CreateRewardRuleSchema,
  type CreateRewardRuleBody,
} from '@internal/shared/reward';
import { useForm } from '@tanstack/vue-form';
import { Button } from '@web/ui/components/ui/button';
import { Loader2 } from 'lucide-vue-next';

import { fromDatetimeLocalValue, toDatetimeLocalValue } from '~/utils/form';

import { pointTypeListQuery } from '../../point/queries';
import { useCreateRewardRule } from '../mutations';

const open = defineModel<boolean>('open', { default: false });

const guardTypeOptions = [
  { label: '总督', value: BiliGuardType.Zongdu },
  { label: '提督', value: BiliGuardType.Tidu },
  { label: '舰长', value: BiliGuardType.Jianzhang },
] as const;

const { data: pointTypes } = useQuery(pointTypeListQuery);
const { mutateAsync: createRewardRule, isLoading } = useCreateRewardRule();

const activePointTypes = computed(
  () => pointTypes.value?.filter(pointType => pointType.status === 'active') ?? [],
);
type RewardRuleFormValues = CreateRewardRuleBody;

function createDefaultValues(): RewardRuleFormValues {
  return {
    name: '',
    description: undefined,
    conditions: {
      type: 'biliGuard',
      guardTypes: undefined,
    },
    pointTypeId: activePointTypes.value[0]?.id ?? '',
    points: 1,
    enabled: false,
    group: undefined,
    startsAt: undefined,
    endsAt: undefined,
    priority: 0,
  };
}

function toggleGuardType(
  field: {
    state: { value: CreateRewardRuleBody['conditions'] };
    handleChange: (value: CreateRewardRuleBody['conditions']) => void;
  },
  guardType: BiliGuardType,
  checked: boolean,
) {
  const current = field.state.value.guardTypes ?? [];
  const guardTypes = checked
    ? [...new Set([...current, guardType])]
    : current.filter(item => item !== guardType);

  field.handleChange({
    type: 'biliGuard',
    guardTypes: guardTypes.length > 0 ? guardTypes : undefined,
  });
}

const form = useForm({
  validators: {
    onSubmit: CreateRewardRuleSchema,
  },
  defaultValues: createDefaultValues(),
  async onSubmit({ value }: { value: RewardRuleFormValues }) {
    await createRewardRule(value);

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
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>添加积分规则</DialogTitle>
        <DialogDescription>创建大航海事件触发的积分发放规则。</DialogDescription>
      </DialogHeader>

      <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="form.handleSubmit">
        <form.Field name="name" #default="{ field }">
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">规则名称</FieldLabel>
            <Input
              :id="field.name"
              :model-value="field.state.value"
              :aria-invalid="field.state.meta.errors.length > 0"
              placeholder="例如：舰长月度奖励"
              @blur="field.handleBlur"
              @input="field.handleChange($event.target.value)"
            />

            <FieldError :errors="field.state.meta.errors" />
          </Field>
        </form.Field>

        <form.Field name="pointTypeId" #default="{ field }">
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">积分类型</FieldLabel>
            <NativeSelect
              :id="field.name"
              :model-value="field.state.value"
              :aria-invalid="field.state.meta.errors.length > 0"
              @blur="field.handleBlur"
              @update:model-value="field.handleChange(String($event))"
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

            <FieldError :errors="field.state.meta.errors" />
          </Field>
        </form.Field>

        <form.Field name="points" #default="{ field }">
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">奖励积分</FieldLabel>
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

            <FieldError :errors="field.state.meta.errors" />
          </Field>
        </form.Field>

        <form.Field name="priority" #default="{ field }">
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">优先级</FieldLabel>
            <Input
              :id="field.name"
              :model-value="field.state.value ?? 0"
              :aria-invalid="field.state.meta.errors.length > 0"
              type="number"
              step="1"
              @blur="field.handleBlur"
              @input="field.handleChange(Number($event.target.value))"
            />

            <FieldError :errors="field.state.meta.errors" />
          </Field>
        </form.Field>

        <form.Field name="group" #default="{ field }">
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">互斥分组</FieldLabel>
            <Input
              :id="field.name"
              :model-value="field.state.value ?? ''"
              :aria-invalid="field.state.meta.errors.length > 0"
              placeholder="可选"
              @blur="field.handleBlur"
              @input="field.handleChange($event.target.value)"
            />

            <FieldDescription>同一分组内只取优先级最高的一条。</FieldDescription>
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

        <form.Field name="conditions" #default="{ field }">
          <Field class="sm:col-span-2" :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">大航海类型</FieldLabel>
            <div class="flex flex-wrap gap-4">
              <label
                v-for="option in guardTypeOptions"
                :key="option.value"
                class="flex items-center gap-2 text-sm"
              >
                <Checkbox
                  :model-value="field.state.value.guardTypes?.includes(option.value) ?? false"
                  @update:model-value="toggleGuardType(field, option.value, Boolean($event))"
                />
                {{ option.label }}
              </label>
            </div>

            <FieldDescription>不选择时匹配全部大航海类型。</FieldDescription>
            <FieldError :errors="field.state.meta.errors" />
          </Field>
        </form.Field>

        <form.Field name="description" #default="{ field }">
          <Field class="sm:col-span-2" :data-invalid="field.state.meta.errors.length > 0">
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

        <DialogFooter class="sm:col-span-2">
          <DialogClose as-child>
            <Button variant="outline" type="button">取消</Button>
          </DialogClose>
          <Button type="submit" :disabled="isLoading || activePointTypes.length === 0">
            <Loader2 v-if="isLoading" class="animate-spin" />
            创建
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
