<script setup lang="ts">
import { UserConvertPointSchema } from '@internal/shared/point-conversion';
import { Button } from '@web/ui/components/ui/button';
import { FormFieldItem, useForm } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

const props = defineProps<{
  rules?: any[] | null;
}>();

const open = defineModel<boolean>('open', { required: true });

const emit = defineEmits<{
  converted: [];
}>();

const { $api } = useNuxtApp();

function createNonce() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function getErrorMessage(error: unknown, fallback = '操作失败，请稍后再试') {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return fallback;
}

const { canSubmit, handleSubmit, isSubmitting, onSubmitSuccess, resetForm, values } = useForm({
  schema: UserConvertPointSchema,
  resetOnSuccess: false,
  initialValues: () => ({
    ruleId: '',
    fromAmount: 1,
    nonce: createNonce(),
  }),
  async transform(values) {
    return $api.pointConversions.convert
      .post({
        ruleId: values.ruleId,
        fromAmount: values.fromAmount,
        nonce: createNonce(),
      })
      .then(res => res.data);
  },
});

const selectedRule = computed(() => {
  return props.rules?.find(rule => rule.id === values.ruleId);
});

const preview = computed(() => {
  if (!selectedRule.value || !Number.isFinite(Number(values.fromAmount))) {
    return null;
  }

  return Number(values.fromAmount) * selectedRule.value.toAmount;
});

const conversionDescription = computed(() => {
  if (!selectedRule.value) {
    return undefined;
  }

  return `${values.fromAmount || 0} ${selectedRule.value.fromPointType?.name} 可转换为 ${
    preview.value ?? 0
  } ${selectedRule.value.toPointType?.name}`;
});

onSubmitSuccess(() => {
  open.value = false;
  toast.success('积分转换成功');
  emit('converted');
  resetForm();
});

const onSubmit = async (event: Event) => {
  try {
    await handleSubmit(event);
  } catch (error) {
    toast.error(getErrorMessage(error, '转换失败'));
  }
};

watch(open, isOpen => {
  if (!isOpen) {
    resetForm();
  }
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>积分转换</DialogTitle>
        <DialogDescription>选择规则并输入要转换的来源积分数量。</DialogDescription>
      </DialogHeader>

      <form class="grid gap-3" @submit="onSubmit">
        <FormFieldItem v-slot="{ componentField }" name="ruleId" label="转换规则" required>
          <NativeSelect v-bind="componentField">
            <NativeSelectOption value="">选择转换规则</NativeSelectOption>
            <NativeSelectOption v-for="rule in rules" :key="rule.id" :value="rule.id">
              {{ rule.fromPointType?.name }} -> {{ rule.toPointType?.name }}
            </NativeSelectOption>
          </NativeSelect>
        </FormFieldItem>

        <FormFieldItem
          v-slot="{ componentField }"
          name="fromAmount"
          label="来源数量"
          :description="conversionDescription"
          required
        >
          <Input v-bind="componentField" type="number" min="1" step="1" />
        </FormFieldItem>

        <DialogFooter>
          <Button type="submit" class="w-full" :disabled="!canSubmit || isSubmitting">
            <Loader2 v-if="isSubmitting" class="animate-spin" />
            确认转换
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
