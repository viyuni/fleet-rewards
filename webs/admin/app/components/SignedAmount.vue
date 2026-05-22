<script setup lang="ts">
import { cn } from '@web/ui/lib/utils';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
  showPlus?: boolean;
  value: number | string;
}>();

const numericValue = computed(() => Number(props.value));
const isPositive = computed(() => numericValue.value > 0);
const isNegative = computed(() => numericValue.value < 0);
const displayValue = computed(() => {
  if (props.showPlus === false || !isPositive.value) {
    return String(props.value);
  }

  return `+${props.value}`;
});
</script>

<template>
  <span
    :class="
      cn(
        isPositive ? 'text-emerald-600' : undefined,
        isNegative ? 'text-destructive' : undefined,
        props.class,
      )
    "
  >
    {{ displayValue }}
  </span>
</template>
