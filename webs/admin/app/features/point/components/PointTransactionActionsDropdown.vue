<script setup lang="ts">
import { Button } from '@web/ui/components/ui/button';
import { MoreHorizontal, Undo2 } from 'lucide-vue-next';

import type { PointTransaction } from './PointTransactionListView.vue';

const props = defineProps<{
  transaction: PointTransaction;
  reversing?: boolean;
}>();

const emit = defineEmits<{
  reverse: [payload: { transaction: PointTransaction; remark?: string }];
}>();

const reversalRemark = ref('');
const isReversalDialogOpen = ref(false);

const canReverse = computed(
  () =>
    props.transaction.type !== 'reversal' &&
    !props.transaction.reversalOfTransactionId &&
    !props.transaction.reversal,
);

const deltaClass = computed(() =>
  props.transaction.delta >= 0 ? 'text-emerald-600' : 'text-destructive',
);

function openReversalDialog() {
  reversalRemark.value = '';
  isReversalDialogOpen.value = true;
}

function handleReverse() {
  emit('reverse', {
    transaction: props.transaction,
    remark: reversalRemark.value.trim() || undefined,
  });
}
</script>

<template>
  <AlertDialog v-model:open="isReversalDialogOpen">
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" class="h-8 w-8 p-0">
          <span class="sr-only">打开菜单</span>
          <MoreHorizontal class="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-50">
        <DropdownMenuItem variant="destructive" :disabled="!canReverse" @click="openReversalDialog">
          <Undo2 />
          冲正流水
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>冲正积分流水</AlertDialogTitle>
        <AlertDialogDescription as-child>
          <div class="space-y-3">
            <p>将为以下流水写入一笔反向变动，当前操作不可重复。</p>
            <dl class="grid grid-cols-[5rem_1fr] gap-x-3 gap-y-2 text-sm">
              <dt class="text-muted-foreground">用户名</dt>
              <dd>{{ transaction.user?.username ?? '-' }}</dd>
              <dt class="text-muted-foreground">UID</dt>
              <dd>{{ transaction.user?.biliUid ?? '-' }}</dd>
              <dt class="text-muted-foreground">积分类型</dt>
              <dd>{{ transaction.pointTypeNameSnapshot }}</dd>
              <dt class="text-muted-foreground">类型</dt>
              <dd>{{ transaction.title }}</dd>
              <dt class="text-muted-foreground">变动</dt>
              <dd :class="deltaClass">{{ transaction.delta }}</dd>
              <dt class="text-muted-foreground">时间</dt>
              <dd>{{ transaction.createdAt?.toLocaleString() ?? '-' }}</dd>
            </dl>
          </div>
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div class="space-y-2">
        <label for="reversal-remark" class="text-sm font-medium">备注</label>
        <Textarea
          id="reversal-remark"
          v-model:model-value="reversalRemark"
          placeholder="默认：积分流水冲正"
        />
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel :disabled="reversing">取消</AlertDialogCancel>
        <AlertDialogAction :disabled="reversing" @click.prevent="handleReverse">
          确认冲正
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
