<script setup lang="ts">
import { UserSelfRegisterSchema } from '@internal/shared/user';
import { Button } from '@web/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@web/ui/components/ui/dialog';
import { FormFieldItem, useForm } from '@web/ui/components/ui/form';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@web/ui/components/ui/input-group';
import { ExternalLink, Loader2 } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import { useCreateBiliRegisterCode, useRegister } from '../mutations';

const emit = defineEmits<{
  authenticated: [];
}>();

const { $api } = useNuxtApp();
const {
  public: { biliRoomId },
} = useRuntimeConfig();
const biliRoomUrl = computed(() =>
  biliRoomId ? `https://live.bilibili.com/${biliRoomId}` : undefined,
);
const biliRegisterCode = ref<string>();
const biliRegisterStatus = ref<'idle' | 'pending' | 'matched' | 'expired'>('idle');
const biliName = ref<string>();
const isConfirmingBiliRegisterCode = ref(false);
const verificationOpen = ref(false);
const createBiliRegisterCodeMutation = useCreateBiliRegisterCode();
const registerMutation = useRegister();
const { isLoading: isCreatingBiliRegisterCode } = createBiliRegisterCodeMutation;

function getErrorMessage(error: unknown, fallback = '操作失败，请稍后再试') {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return fallback;
}

const {
  canSubmit,
  handleSubmit,
  isLoading,
  onSubmitSuccess,
  resetForm: resetRegisterForm,
  setFieldValue,
  values,
} = useForm({
  schema: UserSelfRegisterSchema,
  resetOnSuccess: false,
  initialValues: () => ({
    biliUid: '',
    biliRegisterCode: '',
    username: '',
    password: '',
    email: undefined,
    phone: undefined,
    address: undefined,
  }),
  mutation: registerMutation,
  transform(values) {
    return {
      ...values,
      email: values.email || undefined,
      phone: values.phone || undefined,
      address: values.address || undefined,
    };
  },
});

async function confirmBiliRegisterCode() {
  if (!biliRegisterCode.value) return;

  try {
    isConfirmingBiliRegisterCode.value = true;
    const { data } = await $api.auth.biliRegisterCode({ code: biliRegisterCode.value }).get();

    if (!data) {
      throw new Error('确认 UID 归属失败');
    }

    biliRegisterStatus.value = data.status;

    if (data.status === 'matched') {
      if (data.biliUser.uid !== values.biliUid) {
        toast.error(`验证码归属于 UID ${data.biliUser.uid}，与输入的 UID 不一致`);
        return;
      }

      biliName.value = data.biliUser.name;
      setFieldValue('biliRegisterCode', data.code);
      verificationOpen.value = false;
      toast.success('UID 归属验证成功');
    } else if (data.status === 'pending') {
      toast.error('尚未收到直播间消息，请发送验证码后重试');
    } else if (data.status === 'expired') {
      toast.error('验证码已失效，请重新验证');
    }
  } catch (error) {
    toast.error(getErrorMessage(error, '确认 UID 归属失败'));
  } finally {
    isConfirmingBiliRegisterCode.value = false;
  }
}

async function createBiliRegisterCode() {
  if (!values.biliUid) {
    toast.error('请先输入 B 站 UID');
    return;
  }

  try {
    biliName.value = undefined;
    setFieldValue('biliRegisterCode', '');

    const { data } = await createBiliRegisterCodeMutation.mutateAsync();

    if (!data) {
      toast.error('生成注册码失败');
      return;
    }

    biliRegisterCode.value = data.code;
    biliRegisterStatus.value = 'pending';
    verificationOpen.value = true;
  } catch {
    // The global mutation handler reports request errors.
  }
}

function resetForm() {
  biliRegisterCode.value = undefined;
  biliRegisterStatus.value = 'idle';
  biliName.value = undefined;
  verificationOpen.value = false;
  resetRegisterForm();
}

onSubmitSuccess(() => {
  emit('authenticated');
});

defineExpose({
  resetForm,
});
</script>

<template>
  <form class="grid gap-3" @submit="handleSubmit">
    <FormFieldItem
      v-slot="{ componentField }"
      name="biliUid"
      label="B 站 UID"
      required
      description="需要验证 UID 后才能注册"
    >
      <InputGroup>
        <InputGroupInput
          v-bind="componentField"
          :disabled="biliRegisterStatus === 'matched'"
          placeholder="请输入 B 站 UID"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton :disabled="isCreatingBiliRegisterCode" @click="createBiliRegisterCode">
            <Loader2 v-if="isCreatingBiliRegisterCode" class="animate-spin" />
            {{ biliRegisterStatus === 'matched' ? '重新验证' : '验证' }}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </FormFieldItem>

    <Dialog v-model:open="verificationOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>验证 UID 归属</DialogTitle>
          <DialogDescription>
            请使用 UID {{ values.biliUid }} 在直播间发送以下验证码，然后点击确认。
            <a
              v-if="biliRoomUrl"
              :href="biliRoomUrl"
              target="_blank"
              rel="noreferrer"
              class="text-primary inline-flex items-center gap-1 text-sm underline underline-offset-2"
            >
              前往直播间
              <ExternalLink class="size-3" />
            </a>
          </DialogDescription>
        </DialogHeader>

        <strong class="bg-muted rounded-md py-3 text-center font-mono text-lg">
          {{ biliRegisterCode }}
        </strong>

        <p v-if="biliRegisterStatus === 'expired'" class="text-destructive text-sm">
          验证码已失效，请关闭后重新验证。
        </p>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            :disabled="isCreatingBiliRegisterCode || isConfirmingBiliRegisterCode"
            @click="createBiliRegisterCode"
          >
            <Loader2 v-if="isCreatingBiliRegisterCode" class="animate-spin" />
            重新获取
          </Button>
          <Button
            type="button"
            :disabled="
              isCreatingBiliRegisterCode ||
              isConfirmingBiliRegisterCode ||
              biliRegisterStatus === 'expired'
            "
            @click="confirmBiliRegisterCode"
          >
            <Loader2 v-if="isConfirmingBiliRegisterCode" class="animate-spin" />
            确认验证
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <FormFieldItem v-slot="{ componentField }" name="username" label="用户名" required>
      <Input v-bind="componentField" />
    </FormFieldItem>

    <FormFieldItem v-slot="{ componentField }" name="password" label="密码" required>
      <Input v-bind="componentField" type="password" />
    </FormFieldItem>

    <FormFieldItem v-slot="{ componentField }" name="email" label="邮箱">
      <Input v-bind="componentField" />
    </FormFieldItem>

    <FormFieldItem v-slot="{ componentField }" name="phone" label="手机">
      <Input v-bind="componentField" />
    </FormFieldItem>

    <FormFieldItem v-slot="{ componentField }" name="address" label="收货地址">
      <Textarea v-bind="componentField" />
    </FormFieldItem>

    <DialogFooter>
      <Button
        type="submit"
        class="w-full"
        :disabled="!canSubmit || biliRegisterStatus !== 'matched'"
      >
        <Loader2 v-if="isLoading" class="animate-spin" />
        注册并登录
      </Button>
    </DialogFooter>
  </form>
</template>
