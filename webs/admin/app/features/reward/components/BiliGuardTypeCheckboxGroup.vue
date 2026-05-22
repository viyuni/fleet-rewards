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

const selected = ref(new Set<BiliGuardType>());

function updateSelectedGuardTypes(guardType: BiliGuardType, state: boolean) {
  if (state) {
    selected.value.add(guardType);
  } else {
    selected.value.delete(guardType);
  }

  condition.value.guardTypes = [...selected.value];
}
</script>

<template>
  <div class="flex flex-wrap gap-4">
    <Label
      v-for="option in guardTypeOptions"
      :key="option.value"
      class="flex items-center gap-2 text-sm"
    >
      <Checkbox @update:model-value="updateSelectedGuardTypes(option.value, Boolean($event))" />
      {{ option.label }}
    </Label>
  </div>
</template>
