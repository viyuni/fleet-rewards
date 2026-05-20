<script setup lang="ts">
import { AdjustBalanceSchema, type AdjustBalanceBody } from '@internal/shared/point-account';
import { toTypedSchema } from '@vee-validate/valibot';
import { Button } from '@web/ui/components/ui/button';
import { FormField } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';
import { useField, useForm } from 'vee-validate';

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

const formSchema = toTypedSchema(AdjustBalanceSchema);

const { handleSubmit, meta, resetForm, setFieldValue } = useForm<AdjustBalanceBody>({
  validationSchema: formSchema,
  initialValues: createDefaultValues(props.user.id),
});

const onSubmit = handleSubmit(async values => {
  await adjustUserPoints({
    userId: values.userId,
    pointTypeId: values.pointTypeId,
    delta: values.delta,
    remark: values.remark,
    nonce: crypto.randomUUID(),
  });

  open.value = false;

  resetForm({
    values: {
      userId: values.userId,
      pointTypeId: values.pointTypeId,
      delta: 1,
      remark: '',
      nonce: crypto.randomUUID(),
    },
  });
});

watch(
  () => props.user.id,
  userId => {
    setFieldValue('userId', userId);
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
      setFieldValue('pointTypeId', pointTypeId);
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

      <form class="space-y-4" @submit="onSubmit">
        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="pointTypeId">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>积分类型</FieldLabel>
            <NativeSelect
              :model-value="field.value"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              @blur="field.onBlur"
              @update:model-value="
                selectedPointTypeId = String($event);
                field.onChange(selectedPointTypeId);
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

            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="delta">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>变动数量</FieldLabel>
            <Input
              :model-value="field.value"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              type="number"
              step="1"
              placeholder="正数增加，负数扣减"
              @blur="field.onBlur"
              @input="field.onChange(Number($event.target.value))"
            />

            <FieldDescription
              >扣减请优先使用冲正流水。调整后：{{
                currentBalance + Number(field.value)
              }}</FieldDescription
            >

            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="remark">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>备注</FieldLabel>
            <Textarea
              v-bind="field"
              :model-value="field.value ?? ''"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              placeholder="例如：活动补发 / 违规扣减"
            />

            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline" type="button">取消</Button>
          </DialogClose>
          <Button
            type="submit"
            :disabled="isLoading || activePointTypes.length === 0 || !meta.valid"
          >
            <Loader2 v-if="isLoading" class="animate-spin" />
            确认调整
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
