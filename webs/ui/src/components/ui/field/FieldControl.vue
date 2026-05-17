<script setup lang="ts">
import { computed } from 'vue';
import type { HTMLAttributes } from 'vue';

import Field from './Field.vue';
import FieldDescription from './FieldDescription.vue';
import FieldError from './FieldError.vue';
import FieldLabel from './FieldLabel.vue';

interface FieldControlField {
  name: string;
  state: {
    meta: {
      errors: Array<string | { message: string | undefined } | undefined>;
      isTouched: boolean;
      isValid: boolean;
    };
  };
}

interface FieldLike {
  state: {
    meta: {
      isTouched: boolean;
      isValid: boolean;
    };
  };
}

const props = defineProps<{
  class?: HTMLAttributes['class'];
  field: FieldControlField;
  label: string;
  description?: string;
}>();

defineSlots<{
  default(props: { id: string; invalid: boolean }): unknown;
  description(): unknown;
}>();

function isFieldInvalid(field: FieldLike) {
  return field.state.meta.isTouched && !field.state.meta.isValid;
}

const invalid = computed(() => isFieldInvalid(props.field));
</script>

<template>
  <Field :data-invalid="invalid" :class="props.class">
    <FieldLabel :for="field.name">{{ label }}</FieldLabel>
    <slot :invalid="invalid" :id="field.name" />
    <FieldDescription v-if="$slots.description || description">
      <slot name="description">{{ description }}</slot>
    </FieldDescription>
    <FieldError v-if="invalid" :errors="field.state.meta.errors" />
  </Field>
</template>
