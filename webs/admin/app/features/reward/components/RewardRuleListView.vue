<script lang="ts">
import type { Treaty } from '@elysia/eden';
import type { ColumnDef } from '@tanstack/vue-table';
import { Button } from '@web/ui/components/ui/button';
import { DataTable } from '@web/ui/components/ui/table';
import { MoreHorizontal } from 'lucide-vue-next';

import type { AdminApi } from '~/plugins/api';

import { rewardRuleListQuery } from '../queries/reward';

export type RewardRuleList = Treaty.Data<AdminApi['rewards']['rules']['get']>;
export type RewardRule = NonNullable<RewardRuleList>[number];
</script>

<script setup lang="ts">
const columns: ColumnDef<RewardRule>[] = [
  { accessorKey: 'name', header: '规则名称' },
  { accessorKey: 'pointType.name', header: '积分类型' },
  { accessorKey: 'points', header: '奖励积分' },
  { accessorKey: 'group', header: '互斥分组' },
  { accessorKey: 'priority', header: '优先级' },
  { accessorKey: 'enabled', header: '状态' },
  { id: 'actions', enableHiding: false },
];

const { data: rules } = useQuery(rewardRuleListQuery);
</script>

<template>
  <DataTable :data="rules ?? []" :columns="columns">
    <template #enabled="{ value }">
      <Switch :model-value="value" disabled />
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
          <DropdownMenuItem variant="destructive">删除</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </template>
  </DataTable>
</template>
