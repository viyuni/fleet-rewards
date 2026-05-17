<script setup lang="ts">
import type { StockAdjustmentBody } from '@internal/shared/stock';
import { useForm } from '@tanstack/vue-form';
import { Button } from '@web/ui/components/ui/button';
import { Loader2 } from 'lucide-vue-next';

import { useAdjustProductStock } from '../mutations';
import type { Product } from './ProductListView.vue';

const props = defineProps<{
  product: Product;
}>();

const open = defineModel<boolean>('open', { default: false });

const { mutateAsync: adjustProductStock, isLoading } = useAdjustProductStock();

function optionalText(value: string) {
  const trimmed = value.trim();

  return trimmed || undefined;
}

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
          <FieldControl :field="field" label="调整数量">
            <template #default="{ id, invalid }">
              <Input
                :id="id"
                :model-value="field.state.value"
                :aria-invalid="invalid"
                type="number"
                step="1"
                placeholder="正数入库，负数扣减"
                @blur="field.handleBlur"
                @input="field.handleChange(Number($event.target.value))"
              />
            </template>
            <template #description>
              调整后库存：{{ product.stock + Number(field.state.value) }}
            </template>
          </FieldControl>
        </form.Field>

        <form.Field name="remark" #default="{ field }">
          <FieldControl :field="field" label="备注" v-slot="{ id, invalid }">
            <Textarea
              :id="id"
              :model-value="field.state.value ?? ''"
              :aria-invalid="invalid"
              placeholder="例如：盘点入库 / 损耗扣减"
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
            确认调整
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
