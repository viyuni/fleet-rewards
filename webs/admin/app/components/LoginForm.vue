<script setup lang="ts">
import { toast } from 'vue-sonner';

const emit = defineEmits<{
  submit: [data: { uid: string; password: string }];
}>();

import { AdminLoginSchema } from '@internal/shared/admin';
import { useForm } from '@tanstack/vue-form';

const form = useForm({
  validators: {
    onSubmit: AdminLoginSchema,
    onChange: AdminLoginSchema,
    onBlur: AdminLoginSchema,
  },
  defaultValues: {
    uid: '',
    password: '',
  },
  onSubmit({ value }) {
    emit('submit', value);
  },
});

function handleNotImplemented(e: Event) {
  toast.error('Not implemented 🤣');
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <Card>
      <CardHeader class="text-center">
        <CardTitle class="text-xl"> Welcome back </CardTitle>
        <CardDescription> Login with your Bilibili account </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="form.handleSubmit">
          <FieldGroup>
            <Field>
              <Button variant="outline" type="button" @click="handleNotImplemented">
                <BilibiliIcon class="text-primary" />
                Login with Bilibili
              </Button>
            </Field>

            <FieldSeparator class="*:data-[slot=field-separator-content]:bg-card">
              OR
            </FieldSeparator>

            <form.Field name="uid">
              <template #default="{ field }">
                <Field :data-invalid="isFormFieldInvalid(field)">
                  <FieldLabel :for="field.name"> UID </FieldLabel>
                  <Input
                    :id="field.name"
                    :name="field.name"
                    :model-value="field.state.value"
                    :aria-invalid="isFormFieldInvalid(field)"
                    placeholder="90424564xxx"
                    autocomplete="off"
                    @blur="field.handleBlur"
                    @input="field.handleChange($event.target.value)"
                  />
                  <FieldError v-if="isFormFieldInvalid(field)" :errors="field.state.meta.errors" />
                </Field>
              </template>
            </form.Field>

            <form.Field name="password">
              <template #default="{ field }">
                <Field :data-invalid="isFormFieldInvalid(field)">
                  <FieldLabel for="password"> Password </FieldLabel>
                  <Input
                    :id="field.name"
                    :name="field.name"
                    :model-value="field.state.value"
                    :aria-invalid="isFormFieldInvalid(field)"
                    type="password"
                    autocomplete="off"
                    placeholder="?????"
                    @blur="field.handleBlur"
                    @input="field.handleChange($event.target.value)"
                  />
                  <FieldError v-if="isFormFieldInvalid(field)" :errors="field.state.meta.errors" />
                </Field>
              </template>
            </form.Field>

            <Field>
              <Button type="submit"> Login </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
