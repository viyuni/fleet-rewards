<script lang="ts">
import type { Treaty } from '@elysia/eden';
import type { ColumnDef } from '@tanstack/vue-table';
import { Button } from '@web/ui/components/ui/button';
import { DataTable } from '@web/ui/components/ui/table';
import { MoreHorizontal } from 'lucide-vue-next';

import type { AdminApi } from '~/plugins/api';

import { pointTypeListQuery } from '../queries';

export type PointTypeList = Treaty.Data<AdminApi['points']['types']['get']>;
export type PointType = NonNullable<PointTypeList>[number];
</script>

<script setup lang="ts">
const columns: ColumnDef<PointType>[] = [
  { accessorKey: 'name', header: '名称' },
  { accessorKey: 'description', header: '描述' },
  { accessorKey: 'createdAt', header: '创建时间' },
  { accessorKey: 'status', header: '状态' },
  { id: 'actions', enableHiding: false },
];

const { data: pointTypes } = useQuery(pointTypeListQuery);
</script>

<template>
  <DataTable :data="pointTypes ?? []" :columns="columns">
    <template #status="{ value }">
      <Switch :model-value="value === 'active'" />
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
          <DropdownMenuItem>编辑</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </template>
  </DataTable>
</template>
