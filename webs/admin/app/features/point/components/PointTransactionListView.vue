<script lang="ts">
import type { Treaty } from '@elysia/eden';
import type { PointTransactionPageQuery } from '@internal/shared/point-transaction';
import type { ColumnDef } from '@tanstack/vue-table';
import { DataTable } from '@web/ui/components/ui/table';

import { useDebouncedPageQuery } from '~/composables/useDebouncedPageQuery';
import { usePageQuery } from '~/composables/usePageQuery';
import type { AdminApi } from '~/plugins/api';

import { pointTransactionPageQuery } from '../queries';

export type PointTransactionListPage = Treaty.Data<AdminApi['points']['transactions']['get']>;
export type PointTransaction = NonNullable<PointTransactionListPage>['items'][number];
</script>

<script setup lang="ts">
const columns: ColumnDef<PointTransaction>[] = [
  { accessorKey: 'userId', header: '用户 ID' },
  { accessorKey: 'pointTypeNameSnapshot', header: '积分类型' },
  { accessorKey: 'type', header: '类型' },
  { accessorKey: 'delta', header: '变动' },
  { accessorKey: 'balanceBefore', header: '变动前' },
  { accessorKey: 'balanceAfter', header: '变动后' },
  { accessorKey: 'sourceType', header: '来源' },
  { accessorKey: 'createdAt', header: '创建时间' },
];

const pointTransactionTypeLabelMap: Record<string, string> = {
  grant: '发放',
  consume: '消费',
  refund: '退款',
  adjust: '调整',
  reversal: '冲正',
};

const {
  stateRefs: { page, pageSize, type },
  query,
} = useDebouncedPageQuery<PointTransactionPageQuery>({
  type: undefined,
  pointTypeId: undefined,
  userId: undefined,
  startTime: undefined,
  endTime: undefined,
});

const { items: transactions, meta } = usePageQuery(() => pointTransactionPageQuery(query.value));
</script>

<template>
  <DataTable
    v-model:page="page"
    :data="transactions"
    :columns="columns"
    :total="meta?.total"
    :page-size="pageSize"
  >
    <template #toolbar>
      <NativeSelect v-model:model-value="type">
        <NativeSelectOption value="">流水类型</NativeSelectOption>
        <NativeSelectOption value="grant">发放</NativeSelectOption>
        <NativeSelectOption value="consume">消费</NativeSelectOption>
        <NativeSelectOption value="refund">退款</NativeSelectOption>
        <NativeSelectOption value="adjust">调整</NativeSelectOption>
        <NativeSelectOption value="reversal">冲正</NativeSelectOption>
      </NativeSelect>
    </template>

    <template #type="{ value }">
      {{ pointTransactionTypeLabelMap[value] ?? value }}
    </template>

    <template #delta="{ value }">
      <span :class="Number(value) >= 0 ? 'text-emerald-600' : 'text-destructive'">{{ value }}</span>
    </template>

    <template #createdAt="{ value }">
      {{ value ? new Date(value).toLocaleString() : '-' }}
    </template>
  </DataTable>
</template>
