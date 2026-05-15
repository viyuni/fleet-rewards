<script setup lang="ts">
import { AdjustBalanceSchema, type AdjustBalanceBody } from '@internal/shared/point-account';
import { useForm } from '@tanstack/vue-form';
import { Button } from '@web/ui/components/ui/button';
import { Loader2 } from 'lucide-vue-next';

import { pointTypeListQuery } from '../../point/queries';
import { useAdjustUserPoints } from '../mutations';
import type { User } from '../types';

const props = defineProps<{
  user: User;
}>();

const open = defineModel<boolean>('open', { default: false });

const { data: pointTypes } = useQuery(pointTypeListQuery);
const { mutateAsync: adjustUserPoints, isLoading } = useAdjustUserPoints();

const activePointTypes = computed(
  () => pointTypes.value?.filter(pointType => pointType.status === 'active') ?? [],
);

const selectedPointTypeId = ref('');
const deltaPreview = ref(1);

function createDefaultValues(userId: string): AdjustBalanceBody {
  return {
    userId,
    pointTypeId: '',
    delta: 1,
    remark: '',
    nonce: crypto.randomUUID(),
  };
}

const selectedPointType = computed(() =>
  activePointTypes.value.find(pointType => pointType.id === selectedPointTypeId.value),
);
const selectedPointAccount = computed(() =>
  props.user.pointAccounts?.find(
    pointAccount => pointAccount.pointType?.name === selectedPointType.value?.name,
  ),
);
const currentBalance = computed(() => selectedPointAccount.value?.balance ?? 0);
const adjustedBalance = computed(() => currentBalance.value + deltaPreview.value);

const form = useForm({
  validators: {
    onSubmit: AdjustBalanceSchema,
    onChange: AdjustBalanceSchema,
    onBlur: AdjustBalanceSchema,
  },
  defaultValues: createDefaultValues(props.user.id),
  async onSubmit({ value }: { value: AdjustBalanceBody }) {
    await adjustUserPoints({
      userId: value.userId,
      pointTypeId: value.pointTypeId,
      delta: value.delta,
      remark: value.remark,
      nonce: crypto.randomUUID(),
    });

    open.value = false;

    form.reset({
      userId: value.userId,
      pointTypeId: value.pointTypeId,
      delta: 1,
      remark: '',
      nonce: crypto.randomUUID(),
    });
    deltaPreview.value = 1;
  },
});

watch(
  () => props.user.id,
  userId => {
    form.setFieldValue('userId', userId);
  },
);

watch(
  activePointTypes,
  pointTypes => {
    const hasCurrentPointType = pointTypes.some(
      pointType => pointType.id === selectedPointTypeId.value,
    );

    if (!hasCurrentPointType) {
      const pointTypeId = pointTypes[0]?.id ?? '';

      selectedPointTypeId.value = pointTypeId;
      form.setFieldValue('pointTypeId', pointTypeId);
    }
  },
  { immediate: true },
);
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>操作积分</DialogTitle>
        <DialogDescription>调整 {{ user.username }} 的积分余额。</DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="form.handleSubmit">
        <form.Field name="pointTypeId">
          <template #default="{ field }">
            <Field :data-invalid="isFormFieldInvalid(field)">
              <FieldLabel :for="field.name">积分类型</FieldLabel>
              <NativeSelect
                :id="field.name"
                :model-value="field.state.value"
                :aria-invalid="isFormFieldInvalid(field)"
                @blur="field.handleBlur"
                @update:model-value="
                  selectedPointTypeId = String($event);
                  field.handleChange(selectedPointTypeId);
                "
              >
                <NativeSelectOption value="" disabled>选择积分类型</NativeSelectOption>
                <NativeSelectOption
                  v-for="pointType in activePointTypes"
                  :key="pointType.id"
                  :value="pointType.id"
                >
                  {{ pointType.name }}
                </NativeSelectOption>
              </NativeSelect>
              <FieldDescription>当前积分：{{ currentBalance }}</FieldDescription>
              <FieldError v-if="isFormFieldInvalid(field)" :errors="field.state.meta.errors" />
            </Field>
          </template>
        </form.Field>

        <form.Field name="delta">
          <template #default="{ field }">
            <Field :data-invalid="isFormFieldInvalid(field)">
              <FieldLabel :for="field.name">变动数量</FieldLabel>
              <Input
                :id="field.name"
                :model-value="field.state.value"
                :aria-invalid="isFormFieldInvalid(field)"
                type="number"
                step="1"
                placeholder="正数增加，负数扣减"
                @blur="field.handleBlur"
                @input="
                  deltaPreview = Number($event.target.value);
                  field.handleChange(deltaPreview);
                "
              />
              <FieldDescription>
                输入正数增加积分，输入负数扣减积分。调整后：{{ adjustedBalance }}
              </FieldDescription>
              <FieldError v-if="isFormFieldInvalid(field)" :errors="field.state.meta.errors" />
            </Field>
          </template>
        </form.Field>

        <form.Field name="remark">
          <template #default="{ field }">
            <Field :data-invalid="isFormFieldInvalid(field)">
              <FieldLabel :for="field.name">备注</FieldLabel>
              <Textarea
                :id="field.name"
                :model-value="field.state.value"
                :aria-invalid="isFormFieldInvalid(field)"
                placeholder="例如：活动补发 / 违规扣减"
                @blur="field.handleBlur"
                @input="field.handleChange($event.target.value)"
              />
              <FieldError v-if="isFormFieldInvalid(field)" :errors="field.state.meta.errors" />
            </Field>
          </template>
        </form.Field>

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline" type="button">取消</Button>
          </DialogClose>
          <Button type="submit" :disabled="isLoading || activePointTypes.length === 0">
            <Loader2 v-if="isLoading" class="animate-spin" />
            确认调整
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
