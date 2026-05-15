<script lang="ts">
import type { Treaty } from '@elysia/eden';
import type { ColumnDef } from '@tanstack/vue-table';
import { Button } from '@web/ui/components/ui/button';
import { DataTable } from '@web/ui/components/ui/table';
import { MoreHorizontal } from 'lucide-vue-next';

import type { AdminApi } from '~/plugins/api';

import { pointConversionListQuery } from '../queries';

export type PointConversionList = Treaty.Data<AdminApi['points']['conversions']['get']>;
export type PointConversion = NonNullable<PointConversionList>[number];
export type PointConversionColumns = readonly ColumnDef<PointConversion>[];
</script>

<script setup lang="ts">
const columns = [
  { accessorKey: 'name', header: '规则名称' },
  { accessorKey: 'fromPointTypeId', header: '来源积分' },
  { accessorKey: 'toPointTypeId', header: '目标积分' },
  { accessorKey: 'toAmount', header: '目标数量' },
  { accessorKey: 'createdAt', header: '创建时间' },
  { accessorKey: 'enabled', header: '状态' },
  { id: 'actions', enableHiding: false },
] as const satisfies PointConversionColumns;

const { data: conversions } = useQuery(pointConversionListQuery);
</script>

<template>
  <DataTable :data="conversions ?? []" :columns="columns">
    <template #enabled="{ value }">
      <Switch :model-value="value" />
    </template>

    <template #createdAt="{ value }">
      {{ value?.toLocaleString() ?? '-' }}
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
          <DropdownMenuItem>编辑</DropdownMenuItem>
          <DropdownMenuItem>执行转换</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </template>
  </DataTable>
</template>
