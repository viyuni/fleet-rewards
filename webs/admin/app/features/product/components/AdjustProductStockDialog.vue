<script setup lang="ts">
import { StockAdjustmentSchema, type StockAdjustmentBody } from '@internal/shared/stock';
import { toTypedSchema } from '@vee-validate/valibot';
import { Button } from '@web/ui/components/ui/button';
import { FormField } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';
import { useForm } from 'vee-validate';

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

const formSchema = toTypedSchema(StockAdjustmentSchema);

const { handleSubmit, meta, resetForm } = useForm<StockAdjustmentBody>({
  validationSchema: formSchema,
  initialValues: createDefaultValues(),
});

const onSubmit = handleSubmit(async values => {
  await adjustProductStock({
    productId: props.product.id,
    body: {
      ...values,
      nonce: crypto.randomUUID(),
    },
  });

  resetForm({ values: createDefaultValues() });
  open.value = false;
});

watch(open, isOpen => {
  if (!isOpen) {
    resetForm({ values: createDefaultValues() });
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

      <form class="space-y-4" @submit="onSubmit">
        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="delta">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>调整数量</FieldLabel>
            <Input
              :model-value="field.value"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              type="number"
              step="1"
              placeholder="正数入库，负数扣减"
              @blur="field.onBlur"
              @input="field.onChange(Number($event.target.value))"
            />
            <FieldDescription
              >调整后库存：{{ product.stock + Number(field.value) }}</FieldDescription
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
              placeholder="例如：盘点入库 / 损耗扣减"
            />
            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline" type="button">取消</Button>
          </DialogClose>
          <Button type="submit" :disabled="isLoading || !meta.valid">
            <Loader2 v-if="isLoading" class="animate-spin" />
            确认调整
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
