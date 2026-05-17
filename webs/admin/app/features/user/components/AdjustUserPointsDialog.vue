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
        <form.Field name="pointTypeId" #default="{ field }">
          <FieldControl :field="field" label="积分类型">
            <template #default="{ id, invalid }">
              <NativeSelect
                :id="id"
                :model-value="field.state.value"
                :aria-invalid="invalid"
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
            </template>
            <template #description>当前积分：{{ currentBalance }}</template>
          </FieldControl>
        </form.Field>

        <form.Field name="delta" #default="{ field }">
          <FieldControl :field="field" label="变动数量">
            <template #default="{ id, invalid }">
              <Input
                :id="id"
                :model-value="field.state.value"
                :aria-invalid="invalid"
                type="number"
                step="1"
                placeholder="正数增加，负数扣减"
                @blur="field.handleBlur"
                @input="field.handleChange(Number($event.target.value))"
              />
            </template>
            <template #description>
              扣减请优先使用冲正流水。调整后：{{ currentBalance + Number(field.state.value) }}
            </template>
          </FieldControl>
        </form.Field>

        <form.Field name="remark" #default="{ field }">
          <FieldControl :field="field" label="备注" v-slot="{ id, invalid }">
            <Textarea
              :id="id"
              :model-value="field.state.value"
              :aria-invalid="invalid"
              placeholder="例如：活动补发 / 违规扣减"
              @blur="field.handleBlur"
              @input="field.handleChange($event.target.value)"
            />
          </FieldControl>
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
