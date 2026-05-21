<script setup lang="ts">
import { BiliGuardType, type RewardRuleCondition } from '@internal/shared/reward';

const guardTypeOptions = [
  { label: '总督', value: BiliGuardType.Zongdu },
  { label: '提督', value: BiliGuardType.Tidu },
  { label: '舰长', value: BiliGuardType.Jianzhang },
] as const;

const condition = defineModel<RewardRuleCondition>({
  default: () => ({ type: 'biliGuard' }),
});

function updateSelectedGuardTypes(guardType: BiliGuardType, selected: boolean) {
  const selectedGuardTypes = condition.value.guardTypes ?? [];
  let nextGuardTypes = selectedGuardTypes;

  if (selected && !selectedGuardTypes.includes(guardType)) {
    nextGuardTypes = [...selectedGuardTypes, guardType];
  }

  if (!selected) {
    nextGuardTypes = selectedGuardTypes.filter(item => item !== guardType);
  }

  condition.value = {
    type: 'biliGuard',
    guardTypes: nextGuardTypes.length > 0 ? nextGuardTypes : undefined,
  };
}
</script>

<template>
  <div class="flex flex-wrap gap-4">
    <label
      v-for="option in guardTypeOptions"
      :key="option.value"
      class="flex items-center gap-2 text-sm"
    >
      <Checkbox
        :model-value="condition.guardTypes?.includes(option.value) ?? false"
        @update:model-value="updateSelectedGuardTypes(option.value, Boolean($event))"
      />
      {{ option.label }}
    </label>
  </div>
</template>
