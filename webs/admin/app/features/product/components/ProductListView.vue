<script lang="ts">
import type { Treaty } from '@elysia/eden';
import type { ProductPageQuery } from '@internal/shared/product';
import type { ColumnDef } from '@tanstack/vue-table';
import { Button } from '@web/ui/components/ui/button';
import { DataTable } from '@web/ui/components/ui/table';
import { MoreHorizontal } from 'lucide-vue-next';

import { useDebouncedPageQuery } from '~/composables/useDebouncedPageQuery';
import { usePageQuery } from '~/composables/usePageQuery';
import type { AdminApi } from '~/plugins/api';

import { productPageQuery } from '../queries';

export type ProductListPage = Treaty.Data<AdminApi['products']['get']>;
export type Product = NonNullable<ProductListPage>['items'][number];
</script>

<script setup lang="ts">
const columns: ColumnDef<Product>[] = [
  { accessorKey: 'name', header: '商品名称' },
  { accessorKey: 'pointType.name', header: '积分类型' },
  { accessorKey: 'price', header: '价格' },
  { accessorKey: 'stock', header: '库存' },
  { accessorKey: 'deliveryType', header: '发货方式' },
  { accessorKey: 'status', header: '状态' },
  { id: 'actions', enableHiding: false },
];

const {
  stateRefs: { page, pageSize, keyword, status, deliveryType },
  query,
} = useDebouncedPageQuery<ProductPageQuery>({
  status: undefined,
  deliveryType: undefined,
  pointTypeId: undefined,
});

const { items: products, meta: productMeta } = usePageQuery(() => productPageQuery(query.value));
</script>

<template>
  <DataTable
    v-model:page="page"
    :data="products"
    :columns="columns"
    :total="productMeta?.total"
    :page-size="pageSize"
  >
    <template #toolbar>
      <div class="flex w-full flex-wrap items-center gap-2">
        <Input
          class="max-w-xs"
          placeholder="搜索商品名称 / 描述"
          v-model:model-value.trim="keyword"
        />
        <NativeSelect v-model:model-value="status">
          <NativeSelectOption value="">商品状态</NativeSelectOption>
          <NativeSelectOption value="active">上架</NativeSelectOption>
          <NativeSelectOption value="disabled">下架</NativeSelectOption>
        </NativeSelect>
        <NativeSelect v-model:model-value="deliveryType">
          <NativeSelectOption value="">发货方式</NativeSelectOption>
          <NativeSelectOption value="manual">人工发货</NativeSelectOption>
          <NativeSelectOption value="automatic">自动发货</NativeSelectOption>
        </NativeSelect>
      </div>
    </template>

    <template #deliveryType="{ value }">
      {{ value === 'automatic' ? '自动发货' : '人工发货' }}
    </template>

    <template #status="{ value }">
      <Switch :model-value="value === 'active'" />
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
          <DropdownMenuItem>编辑商品</DropdownMenuItem>
          <DropdownMenuItem>调整库存</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </template>
  </DataTable>
</template>
