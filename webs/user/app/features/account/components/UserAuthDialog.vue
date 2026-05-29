<script lang="ts">
const tabs = ['login', 'register'] as const;
type Tabs = (typeof tabs)[number];
</script>

<script setup lang="ts">
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@web/ui/components/ui/tabs';

import UserLoginForm from './UserLoginForm.vue';
import UserRegisterForm from './UserRegisterForm.vue';

const props = defineProps<{
  authMode: Tabs;
}>();

const open = defineModel<boolean>('open', { required: true });

const emit = defineEmits<{
  'update:authMode': [mode: Tabs];
  authenticated: [user: any];
}>();

const loginForm = useTemplateRef<InstanceType<typeof UserLoginForm>>('loginForm');
const registerForm = useTemplateRef<InstanceType<typeof UserRegisterForm>>('registerForm');

const selectedAuthMode = computed({
  get: () => props.authMode,
  set: mode => emit('update:authMode', mode),
});

function handleAuthenticated(user: any) {
  open.value = false;
  emit('authenticated', user);
}

watch(open, isOpen => {
  if (!isOpen) {
    loginForm.value?.resetForm();
    registerForm.value?.resetForm();
  }
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-lg">
      <Tabs v-model="selectedAuthMode" class="grid gap-4">
        <DialogHeader>
          <DialogTitle>
            <TabsList variant="line" class="gap-2 p-0">
              <TabsTrigger
                class="after:bg-primary data-active:text-primary hover:text-primary h-5 px-0 text-base"
                value="login"
              >
                登录
              </TabsTrigger>
              <TabsTrigger
                class="after:bg-primary data-active:text-primary hover:text-primary h-5 px-0 text-base"
                value="register"
              >
                注册
              </TabsTrigger>
            </TabsList>
          </DialogTitle>
        </DialogHeader>

        <TabsContent value="login">
          <UserLoginForm ref="loginForm" @authenticated="handleAuthenticated" />
        </TabsContent>

        <TabsContent value="register">
          <UserRegisterForm ref="registerForm" @authenticated="handleAuthenticated" />
        </TabsContent>
      </Tabs>
    </DialogContent>
  </Dialog>
</template>
