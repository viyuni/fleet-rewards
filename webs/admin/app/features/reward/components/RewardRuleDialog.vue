<script setup lang="ts">
import {
  BiliGuardType,
  type CreateRewardRuleBody,
  type UpdateRewardRuleBody,
} from '@internal/shared/reward';
import { useForm } from '@tanstack/vue-form';
import { Button } from '@web/ui/components/ui/button';
import { Loader2 } from 'lucide-vue-next';

import { pointTypeListQuery } from '../../point/queries';
import { useCreateRewardRule, useUpdateRewardRule } from '../mutations';
import type { RewardRule } from './RewardRuleListView.vue';

const props = defineProps<{
  rule?: RewardRule;
}>();

const open = defineModel<boolean>('open', { default: false });

const guardTypeOptions = [
  { label: '总督', value: BiliGuardType.Zongdu },
  { label: '提督', value: BiliGuardType.Tidu },
  { label: '舰长', value: BiliGuardType.Jianzhang },
] as const;

const { data: pointTypes } = useQuery(pointTypeListQuery);
const { mutateAsync: createRewardRule, isLoading: isCreating } = useCreateRewardRule();
const { mutateAsync: updateRewardRule, isLoading: isUpdating } = useUpdateRewardRule();

const activePointTypes = computed(
  () => pointTypes.value?.filter(pointType => pointType.status === 'active') ?? [],
);
const isEditing = computed(() => Boolean(props.rule));
const isLoading = computed(() => isCreating.value || isUpdating.value);

function optionalText(value: string) {
  const trimmed = value.trim();

  return trimmed || undefined;
}

function toDatetimeLocalValue(value: Date | string | null | undefined) {
  if (!value) {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);

  return local.toISOString().slice(0, 16);
}

function fromDatetimeLocalValue(value: string) {
  return value ? new Date(value) : undefined;
}

function createDefaultValues(rule?: RewardRule): CreateRewardRuleBody {
  return {
    name: rule?.name ?? '',
    description: rule?.description ?? undefined,
    conditions: rule?.conditions ?? {
      type: 'biliGuard',
      guardTypes: undefined,
    },
    pointTypeId: rule?.pointTypeId ?? activePointTypes.value[0]?.id ?? '',
    points: rule?.points ?? 1,
    enabled: rule?.enabled ?? false,
    group: rule?.group ?? undefined,
    startsAt: rule?.startsAt ?? undefined,
    endsAt: rule?.endsAt ?? undefined,
    priority: rule?.priority ?? 0,
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
  defaultValues: createDefaultValues(props.rule),
  async onSubmit({ value }: { value: CreateRewardRuleBody }) {
    if (props.rule) {
      await updateRewardRule({
        rewardRuleId: props.rule.id,
        body: value satisfies UpdateRewardRuleBody,
      });
    } else {
      await createRewardRule(value);
    }

    form.reset(createDefaultValues(props.rule));
    open.value = false;
  },
});

watch(
  () => props.rule,
  rule => {
    form.reset(createDefaultValues(rule));
  },
);

watch(open, isOpen => {
  if (!isOpen) {
    form.reset(createDefaultValues(props.rule));
  }
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{ isEditing ? '编辑积分规则' : '添加积分规则' }}</DialogTitle>
        <DialogDescription>
          {{ isEditing ? '更新大航海事件的积分发放规则。' : '创建大航海事件触发的积分发放规则。' }}
        </DialogDescription>
      </DialogHeader>

      <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="form.handleSubmit">
        <form.Field name="name" #default="{ field }">
          <FieldControl :field="field" label="规则名称" v-slot="{ id, invalid }">
            <Input
              :id="id"
              :model-value="field.state.value"
              :aria-invalid="invalid"
              placeholder="例如：舰长月度奖励"
              @blur="field.handleBlur"
              @input="field.handleChange($event.target.value)"
            />
          </FieldControl>
        </form.Field>

        <form.Field name="pointTypeId" #default="{ field }">
          <FieldControl :field="field" label="积分类型" v-slot="{ id, invalid }">
            <NativeSelect
              :id="id"
              :model-value="field.state.value"
              :aria-invalid="invalid"
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
          </FieldControl>
        </form.Field>

        <form.Field name="points" #default="{ field }">
          <FieldControl :field="field" label="奖励积分" v-slot="{ id, invalid }">
            <Input
              :id="id"
              :model-value="field.state.value"
              :aria-invalid="invalid"
              type="number"
              min="1"
              step="1"
              @blur="field.handleBlur"
              @input="field.handleChange(Number($event.target.value))"
            />
          </FieldControl>
        </form.Field>

        <form.Field name="priority" #default="{ field }">
          <FieldControl :field="field" label="优先级" v-slot="{ id, invalid }">
            <Input
              :id="id"
              :model-value="field.state.value ?? 0"
              :aria-invalid="invalid"
              type="number"
              step="1"
              @blur="field.handleBlur"
              @input="field.handleChange(Number($event.target.value))"
            />
          </FieldControl>
        </form.Field>

        <form.Field name="group" #default="{ field }">
          <FieldControl
            :field="field"
            label="互斥分组"
            description="同一分组内只取优先级最高的一条。"
            v-slot="{ id, invalid }"
          >
            <Input
              :id="id"
              :model-value="field.state.value ?? ''"
              :aria-invalid="invalid"
              placeholder="可选"
              @blur="field.handleBlur"
              @input="field.handleChange(optionalText($event.target.value))"
            />
          </FieldControl>
        </form.Field>

        <form.Field name="enabled" #default="{ field }">
          <FieldControl :field="field" label="启用状态" v-slot="{ invalid }">
            <Switch
              :model-value="field.state.value ?? false"
              :aria-invalid="invalid"
              @update:model-value="field.handleChange(Boolean($event))"
            />
          </FieldControl>
        </form.Field>

        <form.Field name="startsAt" #default="{ field }">
          <FieldControl :field="field" label="开始时间" v-slot="{ id, invalid }">
            <Input
              :id="id"
              :model-value="toDatetimeLocalValue(field.state.value)"
              :aria-invalid="invalid"
              type="datetime-local"
              @blur="field.handleBlur"
              @input="field.handleChange(fromDatetimeLocalValue($event.target.value))"
            />
          </FieldControl>
        </form.Field>

        <form.Field name="endsAt" #default="{ field }">
          <FieldControl :field="field" label="结束时间" v-slot="{ id, invalid }">
            <Input
              :id="id"
              :model-value="toDatetimeLocalValue(field.state.value)"
              :aria-invalid="invalid"
              type="datetime-local"
              @blur="field.handleBlur"
              @input="field.handleChange(fromDatetimeLocalValue($event.target.value))"
            />
          </FieldControl>
        </form.Field>

        <form.Field name="conditions" #default="{ field }">
          <FieldControl
            class="sm:col-span-2"
            :field="field"
            label="大航海类型"
            description="不选择时匹配全部大航海类型。"
          >
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
          </FieldControl>
        </form.Field>

        <form.Field name="description" #default="{ field }">
          <FieldControl class="sm:col-span-2" :field="field" label="备注" v-slot="{ id, invalid }">
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

        <DialogFooter class="sm:col-span-2">
          <DialogClose as-child>
            <Button variant="outline" type="button">取消</Button>
          </DialogClose>
          <Button type="submit" :disabled="isLoading || activePointTypes.length === 0">
            <Loader2 v-if="isLoading" class="animate-spin" />
            {{ isEditing ? '保存' : '创建' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
