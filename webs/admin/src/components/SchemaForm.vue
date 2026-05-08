<script setup lang="ts">
import { adminLoginSchema } from '@internal/shared/admin';
import { useForm } from '@tanstack/vue-form';

const form = useForm({
  validators: {
    onSubmit: adminLoginSchema,
  },
  defaultValues: {
    uid: '',
    password: '',
  },
});

function isInvalid(field: any) {
  return field.state.meta.isTouched && !field.state.meta.isValid;
}
</script>
<template>
  <form id="form-tanstack-demo" @submit.prevent="form.handleSubmit">
    <FieldGroup>
      <form.Field name="uid">
        <template #default="{ field }">
          <Field :data-invalid="isInvalid(field)">
            <FieldLabel :for="field.name"> Bug Title </FieldLabel>
            <Input
              :id="field.name"
              :name="field.name"
              :model-value="field.state.value"
              :aria-invalid="isInvalid(field)"
              placeholder="Login button not working on mobile"
              autocomplete="off"
              @blur="field.handleBlur"
              @input="field.handleChange($event.target.value)"
            />
            <FieldError v-if="isInvalid(field)" :errors="field.state.meta.errors" />
          </Field>
        </template>
      </form.Field>
      <form.Field name="password">
        <template #default="{ field }">
          <Field :data-invalid="isInvalid(field)">
            <FieldLabel :for="field.name"> Description </FieldLabel>
            <InputGroup>
              <InputGroupTextarea
                :id="field.name"
                :name="field.name"
                :model-value="field.state.value"
                placeholder="I'm having an issue with the login button on mobile."
                :rows="6"
                class="min-h-24 resize-none"
                :aria-invalid="isInvalid(field)"
                @blur="field.handleBlur"
                @input="field.handleChange($event.target.value)"
              />
              <InputGroupAddon align="block-end">
                <InputGroupText class="tabular-nums">
                  {{ field.state.value?.length || 0 }}/100 characters
                </InputGroupText>
              </InputGroupAddon>
            </InputGroup>
            <FieldDescription>
              Include steps to reproduce, expected behavior, and what actually happened.
            </FieldDescription>
            <FieldError v-if="isInvalid(field)" :errors="field.state.meta.errors" />
          </Field>
        </template>
      </form.Field>
    </FieldGroup>
  </form>
</template>
