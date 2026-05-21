<script setup lang="ts">
import { pointTypeListQuery } from '../queries';

const props = withDefaults(
  defineProps<{
    autoSelectFirst?: boolean;
    placeholder: string;
    invalid?: boolean;
  }>(),
  {
    autoSelectFirst: true,
  },
);

const modelValue = defineModel<string>({ default: '' });

const emit = defineEmits<{
  blur: [e: Event];
  select: [pointType: { id: string; name: string } | undefined];
}>();

const { data: pointTypes } = useQuery(pointTypeListQuery);

const activePointTypes = computed(
  () => pointTypes.value?.filter(pointType => pointType.status === 'active') ?? [],
);

const selectedPointType = computed(() =>
  activePointTypes.value.find(pointType => pointType.id === modelValue.value),
);

watch(
  activePointTypes,
  pointTypes => {
    if (props.autoSelectFirst && !modelValue.value) {
      modelValue.value = pointTypes[0]?.id ?? '';
    }
  },
  { immediate: true },
);

watch(
  selectedPointType,
  pointType => {
    emit('select', pointType);
  },
  { immediate: true },
);
</script>

<template>
  <NativeSelect
    :model-value="modelValue"
    :aria-invalid="invalid"
    @blur="emit('blur', $event)"
    @update:model-value="modelValue = String($event)"
  >
    <NativeSelectOption value="" disabled>{{ placeholder }}</NativeSelectOption>
    <NativeSelectOption
      v-for="pointType in activePointTypes"
      :key="pointType.id"
      :value="pointType.id"
    >
      {{ pointType.name }}
    </NativeSelectOption>
  </NativeSelect>
</template>
