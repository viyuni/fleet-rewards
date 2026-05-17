<script setup lang="ts">
import { Button } from '@web/ui/components/ui/button';
import { useOverlay } from '@web/ui/components/ui/overlay';
import { MoreHorizontal, Undo2 } from 'lucide-vue-next';

import { useReversePointTransaction } from '../mutations';
import type { PointTransaction } from './PointTransactionListView.vue';
import ReversePointTransactionDialog from './ReversePointTransactionDialog.vue';

const props = defineProps<{
  transaction: PointTransaction;
}>();

const [openReversePointTransactionDialog] = useOverlay(ReversePointTransactionDialog);
const { mutateAsync: reverseTransaction, isLoading: isReversing } = useReversePointTransaction();

const canReverse = computed(
  () =>
    props.transaction.type !== 'reversal' &&
    !props.transaction.reversalOfTransactionId &&
    !props.transaction.reversal,
);

async function openReversalDialog() {
  const payload = await openReversePointTransactionDialog({
    transaction: props.transaction,
    reversing: isReversing.value,
  });

  if (!payload) {
    return;
  }

  await reverseTransaction({
    transactionId: payload.transaction.id,
    remark: payload.remark,
  });
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" class="h-8 w-8 p-0">
        <span class="sr-only">打开菜单</span>
        <MoreHorizontal class="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-50">
      <DropdownMenuItem
        variant="destructive"
        :disabled="!canReverse || isReversing"
        @click="openReversalDialog"
      >
        <Undo2 />
        冲正流水
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
