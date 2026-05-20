<script setup lang="ts">
import { toast } from 'vue-sonner';

const emit = defineEmits<{
  submit: [data: { uid: string; password: string }];
}>();

import { AdminLoginSchema, type AdminLoginBody } from '@internal/shared/admin';
import { toTypedSchema } from '@vee-validate/valibot';
import { FormField } from '@web/ui/components/ui/form';
import { useForm } from 'vee-validate';

const formSchema = toTypedSchema(AdminLoginSchema);

const { handleSubmit } = useForm<AdminLoginBody>({
  validationSchema: formSchema,
  initialValues: {
    uid: '',
    password: '',
  },
});

const onSubmit = handleSubmit(values => {
  emit('submit', values);
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
        <form @submit="onSubmit">
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

            <FormField v-slot="{ field, errors, meta: fieldMeta }" name="uid">
              <Field :data-invalid="fieldMeta.touched && errors.length > 0">
                <FieldLabel>UID</FieldLabel>
                <Input
                  v-bind="field"
                  :model-value="field.value ?? ''"
                  :aria-invalid="fieldMeta.touched && errors.length > 0"
                  placeholder="90424564xxx"
                  autocomplete="off"
                />

                <FieldError :errors="errors" />
              </Field>
            </FormField>

            <FormField v-slot="{ field, errors, meta: fieldMeta }" name="password">
              <Field :data-invalid="fieldMeta.touched && errors.length > 0">
                <FieldLabel>Password</FieldLabel>
                <Input
                  v-bind="field"
                  :model-value="field.value ?? ''"
                  :aria-invalid="fieldMeta.touched && errors.length > 0"
                  type="password"
                  autocomplete="off"
                  placeholder="?????"
                />

                <FieldError :errors="errors" />
              </Field>
            </FormField>

            <Field>
              <Button type="submit"> Login </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
