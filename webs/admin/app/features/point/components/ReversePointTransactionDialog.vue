<script setup lang="ts">
import {
  ReversalTransactionSchema,
  type ReversalPointTransactionBody,
} from '@internal/shared/point-account';
import { toTypedSchema } from '@vee-validate/valibot';
import { Button } from '@web/ui/components/ui/button';
import { FormField } from '@web/ui/components/ui/form';
import { useForm } from 'vee-validate';

import type { PointTransaction } from './PointTransactionListView.vue';

const props = defineProps<{
  transaction: PointTransaction;
  reversing?: boolean;
}>();

const emit = defineEmits<{
  resolve: [payload: { transaction: PointTransaction; remark?: string }];
}>();

const open = defineModel<boolean>('open', { default: false });

const deltaClass = computed(() =>
  props.transaction.delta >= 0 ? 'text-emerald-600' : 'text-destructive',
);
const signedDelta = computed(() =>
  props.transaction.delta > 0 ? `+${props.transaction.delta}` : String(props.transaction.delta),
);

function createDefaultValues(transactionId: string): ReversalPointTransactionBody {
  return {
    transactionId,
    remark: undefined,
  };
}

const formSchema = toTypedSchema(ReversalTransactionSchema);

const { handleSubmit, resetForm, setFieldValue } = useForm<ReversalPointTransactionBody>({
  validationSchema: formSchema,
  initialValues: createDefaultValues(props.transaction.id),
});

const onSubmit = handleSubmit(values => {
  emit('resolve', {
    transaction: props.transaction,
    remark: values.remark,
  });
});

watch(
  () => props.transaction.id,
  transactionId => {
    setFieldValue('transactionId', transactionId);
  },
);

function resetValues() {
  resetForm({ values: createDefaultValues(props.transaction.id) });
}

watch(open, isOpen => {
  if (!isOpen) {
    resetValues();
  }
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>冲正积分流水</DialogTitle>
        <DialogDescription as-child>
          <div class="w-full space-y-4">
            <p>将为这笔流水写入一笔反向变动，当前操作不可重复</p>

            <div class="border-border divide-border w-full rounded-md border text-sm">
              <section class="grid gap-3 p-3 sm:grid-cols-[7rem_1fr]">
                <div class="text-muted-foreground font-medium">用户</div>
                <div class="min-w-0 space-y-1">
                  <div class="text-foreground font-medium">
                    {{ transaction.user?.username ?? '-' }}
                  </div>
                  <div class="text-muted-foreground">
                    UID {{ transaction.user?.biliUid ?? '-' }}
                  </div>
                </div>
              </section>

              <section class="grid gap-3 border-t p-3 sm:grid-cols-[7rem_1fr]">
                <div class="text-muted-foreground font-medium">流水</div>
                <div class="grid gap-2 sm:grid-cols-2">
                  <div>
                    <div class="text-muted-foreground text-xs">积分类型</div>
                    <div class="text-foreground font-medium">
                      {{ transaction.pointTypeNameSnapshot }}
                    </div>
                  </div>
                  <div>
                    <div class="text-muted-foreground text-xs">类型</div>
                    <div class="text-foreground font-medium">{{ transaction.title }}</div>
                  </div>
                  <div class="sm:col-span-2">
                    <div class="text-muted-foreground text-xs">时间</div>
                    <div class="text-foreground">
                      {{ transaction.createdAt?.toLocaleString() ?? '-' }}
                    </div>
                  </div>
                </div>
              </section>

              <section class="grid gap-3 border-t p-3 sm:grid-cols-[7rem_1fr]">
                <div class="text-muted-foreground font-medium">余额影响</div>
                <div class="grid grid-cols-3 gap-2">
                  <div>
                    <div class="text-muted-foreground text-xs">变动前</div>
                    <div class="text-foreground font-medium">{{ transaction.balanceBefore }}</div>
                  </div>
                  <div>
                    <div class="text-muted-foreground text-xs">变动</div>
                    <div class="font-semibold" :class="deltaClass">{{ signedDelta }}</div>
                  </div>
                  <div>
                    <div class="text-muted-foreground text-xs">变动后</div>
                    <div class="text-foreground font-medium">{{ transaction.balanceAfter }}</div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit="onSubmit">
        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="remark">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>备注</FieldLabel>
            <Textarea
              v-bind="field"
              :model-value="field.value ?? ''"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              placeholder="默认：积分流水冲正"
            />

            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline" type="button" :disabled="reversing">取消</Button>
          </DialogClose>
          <Button type="submit" :disabled="reversing">确认冲正</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
