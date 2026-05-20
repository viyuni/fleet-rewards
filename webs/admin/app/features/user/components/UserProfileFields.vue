<script setup lang="ts">
import { FormField } from '@web/ui/components/ui/form';
</script>

<template>
  <FormField v-slot="{ field, errors, meta: fieldMeta }" name="username">
    <Field :data-invalid="fieldMeta.touched && errors.length > 0">
      <FieldLabel>用户名</FieldLabel>
      <Input
        v-bind="field"
        :model-value="field.value ?? ''"
        :aria-invalid="fieldMeta.touched && errors.length > 0"
        placeholder="3-32 位用户名"
      />
      <FieldError :errors="errors" />
    </Field>
  </FormField>

  <FormField v-slot="{ field, errors, meta: fieldMeta }" name="email">
    <Field :data-invalid="fieldMeta.touched && errors.length > 0">
      <FieldLabel>邮箱</FieldLabel>
      <Input
        v-bind="field"
        :model-value="field.value ?? ''"
        :aria-invalid="fieldMeta.touched && errors.length > 0"
        type="email"
        placeholder="可选"
      />
      <FieldError :errors="errors" />
    </Field>
  </FormField>

  <FormField v-slot="{ field, errors, meta: fieldMeta }" name="phone">
    <Field :data-invalid="fieldMeta.touched && errors.length > 0">
      <FieldLabel>手机号</FieldLabel>
      <Input
        v-bind="field"
        :model-value="field.value ?? ''"
        :aria-invalid="fieldMeta.touched && errors.length > 0"
        placeholder="可选"
      />
      <FieldError :errors="errors" />
    </Field>
  </FormField>

  <FormField v-slot="{ field, errors, meta: fieldMeta }" name="address">
    <Field :data-invalid="fieldMeta.touched && errors.length > 0">
      <FieldLabel>收货地址</FieldLabel>
      <Input
        v-bind="field"
        :model-value="field.value ?? ''"
        :aria-invalid="fieldMeta.touched && errors.length > 0"
        placeholder="可选"
      />
      <FieldError :errors="errors" />
    </Field>
  </FormField>
</template>
