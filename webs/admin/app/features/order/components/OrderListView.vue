<script lang="ts">
import type { Treaty } from '@elysia/eden';
import type { OrderPageQuery } from '@internal/shared/order';
import type { ColumnDef } from '@tanstack/vue-table';
import { Button } from '@web/ui/components/ui/button';
import { DataTable } from '@web/ui/components/ui/table';
import { MoreHorizontal } from 'lucide-vue-next';

import { useDebouncedPageQuery } from '~/composables/useDebouncedPageQuery';
import { usePageQuery } from '~/composables/usePageQuery';
import type { AdminApi } from '~/plugins/api';

import { orderPageQuery } from '../queries';

export type OrderListPage = Treaty.Data<AdminApi['orders']['get']>;
export type Order = NonNullable<OrderListPage>['items'][number];
</script>

<script setup lang="ts">
const columns = [
  { accessorKey: 'orderNo', header: '订单号' },
  { accessorKey: 'productNameSnapshot', header: '商品' },
  { accessorKey: 'pointTypeNameSnapshot', header: '积分类型' },
  { accessorKey: 'price', header: '价格' },
  { accessorKey: 'status', header: '状态' },
  { accessorKey: 'createdAt', header: '创建时间' },
  { id: 'actions', enableHiding: false },
] satisfies ColumnDef<Order>[];

const {
  stateRefs: { page, pageSize, keyword, status },
  query,
} = useDebouncedPageQuery<OrderPageQuery>({
  status: undefined,
  startAt: undefined,
  endAt: undefined,
  userId: undefined,
});

const { items: orders, meta: orderMeta } = usePageQuery(() => orderPageQuery(query.value));
</script>

<template>
  <DataTable
    v-model:page="page"
    :data="orders"
    :columns="columns"
    :total="orderMeta?.total"
    :page-size="pageSize"
  >
    <template #toolbar>
      <div class="flex w-full flex-wrap items-center gap-2">
        <Input
          class="max-w-xs"
          placeholder="搜索商品 / 积分类型"
          v-model:model-value.trim="keyword"
        />
        <NativeSelect v-model:model-value="status">
          <NativeSelectOption value="">订单状态</NativeSelectOption>
          <NativeSelectOption value="pending">待处理</NativeSelectOption>
          <NativeSelectOption value="completed">已完成</NativeSelectOption>
          <NativeSelectOption value="refunded">已退款</NativeSelectOption>
        </NativeSelect>
      </div>
    </template>

    <template #status="{ value }">
      <Badge
        size="sm"
        :variant="
          value === 'refunded' ? 'destructive' : value === 'completed' ? 'outline' : 'secondary'
        "
      >
        {{ value === 'pending' ? '待处理' : value === 'completed' ? '已完成' : '已退款' }}
      </Badge>
    </template>

    <template #createdAt="{ value }">
      {{ value ? new Date(value).toLocaleString() : '-' }}
    </template>

    <template #actions>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" class="h-8 w-8 p-0">
            <span class="sr-only">打开菜单</span>
            <MoreHorizontal class="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-50">
          <DropdownMenuLabel>操作</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>查看详情</DropdownMenuItem>
          <DropdownMenuItem>填写快递</DropdownMenuItem>
          <DropdownMenuItem>完成 / 退款</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </template>
  </DataTable>
</template>
