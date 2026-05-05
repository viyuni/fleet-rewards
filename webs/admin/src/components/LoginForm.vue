<script setup lang="ts">
defineEmits<{
  submit: [data: { biliUid: string; password: string }];
}>();

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
        <form @submit.prevent="$emit('submit', { biliUid: '1', password: '123456' })">
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
            <Field>
              <FieldLabel for="uid"> UID </FieldLabel>
              <Input id="uid" type="number" placeholder="90424564xxx" required />
            </Field>
            <Field>
              <div class="flex items-center">
                <FieldLabel for="password"> Password </FieldLabel>
                <a
                  href="#"
                  class="ml-auto text-sm underline-offset-4 hover:underline"
                  @click="handleNotImplemented"
                >
                  Forgot your password?
                </a>
              </div>
              <Input id="password" type="password" required />
            </Field>
            <Field>
              <Button type="submit"> Login </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
