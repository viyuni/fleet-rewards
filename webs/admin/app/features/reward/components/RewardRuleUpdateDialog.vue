<script setup lang="ts">
import {
  BiliGuardType,
  UpdateRewardRuleSchema,
  type RewardRuleCondition,
  type UpdateRewardRuleBody,
} from '@internal/shared/reward';
import { Button } from '@web/ui/components/ui/button';
import { FormFieldItem, usePopoverForm } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';

import PointTypeSelect from '../../point/components/PointTypeSelect.vue';
import { useUpdateRewardRule } from '../mutations';
import BiliGuardTypeCheckboxGroup from './BiliGuardTypeCheckboxGroup.vue';
import type { RewardRule } from './RewardRuleListView.vue';

const props = defineProps<{
  rule: RewardRule;
}>();

const open = defineModel<boolean>('open', { default: false });

const updateRewardRuleMutation = useUpdateRewardRule();

type RewardRuleFormValues = UpdateRewardRuleBody;

const biliGuardTypes = [BiliGuardType.Zongdu, BiliGuardType.Tidu, BiliGuardType.Jianzhang];

function isBiliGuardType(value: unknown): value is BiliGuardType {
  return biliGuardTypes.includes(value as BiliGuardType);
}

function toRewardRuleCondition(condition: RewardRule['conditions']): RewardRuleCondition {
  return {
    type: 'biliGuard',
    guardTypes: condition.guardTypes?.filter(isBiliGuardType),
  };
}

function createDefaultValues(rule?: RewardRule): RewardRuleFormValues {
  return {
    name: rule?.name ?? '',
    description: rule?.description ?? undefined,
    conditions: rule ? toRewardRuleCondition(rule.conditions) : { type: 'biliGuard' },
    pointTypeId: rule?.pointTypeId ?? '',
    points: rule?.points ?? 1,
    enabled: rule?.enabled ?? false,
    group: rule?.group ?? undefined,
    startTime: toDatetimeLocalValue(rule?.startTime),
    endTime: toDatetimeLocalValue(rule?.endTime),
    priority: rule?.priority ?? 0,
  };
}

const { canSubmit, handleSubmit, isLoading } = usePopoverForm({
  schema: UpdateRewardRuleSchema,
  open,
  initialValues: () => createDefaultValues(props.rule),
  mutation: {
    isLoading: updateRewardRuleMutation.isLoading,
    mutateAsync(body) {
      return updateRewardRuleMutation.mutateAsync({
        rewardRuleId: props.rule.id,
        body,
      });
    },
  },
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>编辑积分规则</DialogTitle>
        <DialogDescription>更新大航海事件的积分发放规则。</DialogDescription>
      </DialogHeader>

      <form class="grid gap-4 sm:grid-cols-2" @submit="handleSubmit">
        <FormFieldItem v-slot="{ componentField }" name="name" label="规则名称" required>
          <Input v-bind="componentField" placeholder="例如：舰长月度奖励" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="pointTypeId" label="积分类型" required>
          <PointTypeSelect v-bind="componentField" placeholder="选择积分类型" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="points" label="奖励积分" required>
          <Input v-bind="componentField" type="number" min="1" step="1" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="priority" label="优先级" required>
          <Input v-bind="componentField" type="number" step="1" />
        </FormFieldItem>

        <FormFieldItem
          v-slot="{ componentField }"
          name="group"
          label="互斥分组"
          description="同一分组内只取优先级最高的一条。"
        >
          <Input v-bind="componentField" placeholder="可选" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="enabled" label="启用状态">
          <Switch v-bind="componentField" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="startTime" label="开始时间">
          <Input v-bind="componentField" type="datetime-local" step="1" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="endTime" label="结束时间">
          <Input v-bind="componentField" type="datetime-local" step="1" />
        </FormFieldItem>

        <FormFieldItem
          v-slot="{ field }"
          class="sm:col-span-2"
          name="conditions"
          label="大航海类型"
          description="不选择时不会触发奖励。"
        >
          <BiliGuardTypeCheckboxGroup
            :model-value="field.value ?? { type: 'biliGuard' }"
            @update:model-value="field.onChange"
          />
        </FormFieldItem>

        <FormFieldItem
          v-slot="{ componentField }"
          class="sm:col-span-2"
          name="description"
          label="备注"
        >
          <Textarea v-bind="componentField" placeholder="可选" />
        </FormFieldItem>

        <DialogFooter class="sm:col-span-2">
          <DialogClose as-child>
            <Button variant="outline" type="button">取消</Button>
          </DialogClose>
          <Button type="submit" :disabled="!canSubmit">
            <Loader2 v-if="isLoading" class="animate-spin" />
            保存
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
