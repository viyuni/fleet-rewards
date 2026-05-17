<script setup lang="ts">
import type { ConvertPointBody } from '@internal/shared/point-conversion';
import { useForm } from '@tanstack/vue-form';
import { Button } from '@web/ui/components/ui/button';
import { Loader2 } from 'lucide-vue-next';

import UserSelect from '../../user/components/UserSelect.vue';
import { useConvertPoint } from '../mutations';
import type { PointConversion } from './PointConversionListView.vue';

const props = defineProps<{
  conversion: PointConversion;
}>();

const open = defineModel<boolean>('open', { default: false });

const { mutateAsync: convertPoint, isLoading } = useConvertPoint();
const userSelect = ref<InstanceType<typeof UserSelect>>();

const fromPointTypeName = computed(
  () =>
    props.conversion.fromPointTypeName ??
    props.conversion.fromPointType?.name ??
    props.conversion.fromPointTypeId,
);
const toPointTypeName = computed(
  () =>
    props.conversion.toPointTypeName ??
    props.conversion.toPointType?.name ??
    props.conversion.toPointTypeId,
);

function optionalText(value: string) {
  const trimmed = value.trim();

  return trimmed || undefined;
}

function createDefaultValues(ruleId: string): ConvertPointBody {
  return {
    ruleId,
    userId: '',
    fromAmount: props.conversion.minConvertAmount ?? 1,
    remark: undefined,
    nonce: crypto.randomUUID(),
  };
}

const form = useForm({
  defaultValues: createDefaultValues(props.conversion.id),
  async onSubmit({ value }: { value: ConvertPointBody }) {
    await convertPoint({
      ...value,
      ruleId: props.conversion.id,
      nonce: crypto.randomUUID(),
    });

    form.reset(createDefaultValues(props.conversion.id));
    open.value = false;
  },
});

watch(
  () => props.conversion.id,
  ruleId => {
    form.reset(createDefaultValues(ruleId));
  },
);

watch(open, isOpen => {
  if (!isOpen) {
    form.reset(createDefaultValues(props.conversion.id));
    userSelect.value?.reset();
  }
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>执行积分转换</DialogTitle>
        <DialogDescription>
          {{ conversion.name }}：1 个 {{ fromPointTypeName }} 转换为 {{ conversion.toAmount }} 个
          {{ toPointTypeName }}。
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="form.handleSubmit">
        <form.Field name="userId" #default="{ field }">
          <FieldControl :field="field" label="用户 ID" v-slot="{ id, invalid }">
            <UserSelect
              :id="id"
              ref="userSelect"
              :model-value="field.state.value"
              :aria-invalid="invalid"
              @update:model-value="field.handleChange($event)"
              @blur="field.handleBlur"
            />
          </FieldControl>
        </form.Field>

        <form.Field name="fromAmount" #default="{ field }">
          <FieldControl :field="field" :label="`${fromPointTypeName}数量`" v-slot="{ id, invalid }">
            <Input
              :id="id"
              :model-value="field.state.value"
              :aria-invalid="invalid"
              type="number"
              min="1"
              step="1"
              @blur="field.handleBlur"
              @input="field.handleChange(Number($event.target.value))"
            />
          </FieldControl>
        </form.Field>

        <form.Field name="remark" #default="{ field }">
          <FieldControl :field="field" label="备注" v-slot="{ id, invalid }">
            <Textarea
              :id="id"
              :model-value="field.state.value ?? ''"
              :aria-invalid="invalid"
              placeholder="可选"
              @blur="field.handleBlur"
              @input="field.handleChange(optionalText($event.target.value))"
            />
          </FieldControl>
        </form.Field>

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline" type="button">取消</Button>
          </DialogClose>
          <Button type="submit" :disabled="isLoading">
            <Loader2 v-if="isLoading" class="animate-spin" />
            执行转换
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
