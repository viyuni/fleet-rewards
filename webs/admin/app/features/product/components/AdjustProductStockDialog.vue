<script setup lang="ts">
import type { StockAdjustmentBody } from '@internal/shared/stock';
import { useForm } from '@tanstack/vue-form';
import { Button } from '@web/ui/components/ui/button';
import { Loader2 } from 'lucide-vue-next';

import { optionalText } from '~/utils/form';

import { useAdjustProductStock } from '../mutations';
import type { Product } from './ProductListView.vue';

const props = defineProps<{
  product: Product;
}>();

const open = defineModel<boolean>('open', { default: false });

const { mutateAsync: adjustProductStock, isLoading } = useAdjustProductStock();

function createDefaultValues(): StockAdjustmentBody {
  return {
    delta: 1,
    remark: undefined,
    nonce: crypto.randomUUID(),
  };
}

const form = useForm({
  defaultValues: createDefaultValues(),
  async onSubmit({ value }: { value: StockAdjustmentBody }) {
    await adjustProductStock({
      productId: props.product.id,
      body: {
        ...value,
        nonce: crypto.randomUUID(),
      },
    });

    form.reset(createDefaultValues());
    open.value = false;
  },
});

watch(open, isOpen => {
  if (!isOpen) {
    form.reset(createDefaultValues());
  }
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>调整库存</DialogTitle>
        <DialogDescription> {{ product.name }} 当前库存为 {{ product.stock }}。 </DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="form.handleSubmit">
        <form.Field name="delta" #default="{ field }">
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">调整数量</FieldLabel>
            <Input
              :id="field.name"
              :model-value="field.state.value"
              :aria-invalid="field.state.meta.errors.length > 0"
              type="number"
              step="1"
              placeholder="正数入库，负数扣减"
              @blur="field.handleBlur"
              @input="field.handleChange(Number($event.target.value))"
            />
            <FieldDescription
              >调整后库存：{{ product.stock + Number(field.state.value) }}</FieldDescription
            >
            <FieldError :errors="field.state.meta.errors" />
          </Field>
        </form.Field>

        <form.Field name="remark" #default="{ field }">
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">备注</FieldLabel>
            <Textarea
              :id="field.name"
              :model-value="field.state.value ?? ''"
              :aria-invalid="field.state.meta.errors.length > 0"
              placeholder="例如：盘点入库 / 损耗扣减"
              @blur="field.handleBlur"
              @input="field.handleChange(optionalText($event.target.value))"
            />
            <FieldError :errors="field.state.meta.errors" />
          </Field>
        </form.Field>

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline" type="button">取消</Button>
          </DialogClose>
          <Button type="submit" :disabled="isLoading">
            <Loader2 v-if="isLoading" class="animate-spin" />
            确认调整
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
