<script lang="ts">
import type { Treaty } from '@elysia/eden';
import type { Column, ColumnDef } from '@tanstack/vue-table';
import { Button } from '@web/ui/button';
import { DataTable } from '@web/ui/table';
import { MoreHorizontal, Settings2 } from 'lucide-vue-next';

import { api } from '#eden';
import type { UserPageQuery } from '#shared/user';
import { useDebouncedPageQuery } from '#web/admin/composables/useDebouncedPageQuery';
import { usePageQuery } from '#web/admin/composables/usePageQuery';

import { userPageQuery } from '../queries/user';

export type UserListPage = Treaty.Data<typeof api.users.get>;
export type User = NonNullable<UserListPage>['items'][number];
</script>

<script setup lang="ts">
const columnLabels: Record<string, string> = {
  biliUid: 'UID',
  username: '用户名',
  email: '邮箱',
  phone: '手机号',
  address: '地址',
  status: '状态',
};

const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'biliUid',
    header: 'UID',
  },
  {
    accessorKey: 'username',
    header: '用户名',
  },
  {
    accessorKey: 'email',
    header: '邮箱',
  },
  {
    accessorKey: 'phone',
    header: '手机号',
  },
  {
    accessorKey: 'address',
    header: '地址',
  },
  {
    accessorKey: 'status',
    header: '状态',
  },
  {
    id: 'actions',
    enableHiding: false,
  },
];

const {
  stateRefs: { page, pageSize, keyword },
  query,
} = useDebouncedPageQuery<UserPageQuery>();

const { items: users, meta: userMeta } = usePageQuery(() => userPageQuery(query.value));
</script>

<template>
  <div class="w-full p-3">
    <DataTable
      v-model:page="page"
      :data="users"
      :columns="columns"
      :total="userMeta?.total"
      :page-size="userMeta?.pageSize ?? pageSize"
    >
      <template #toolbar="{ table }">
        <div class="flex items-center justify-end gap-2">
          <Input
            class="max-w-xs"
            placeholder="Filter keywords..."
            v-model:model-value.trim="keyword"
          />
        </div>
      </template>

      <template #biliUid="{ value }">
        {{ value }}
      </template>

      <template #username="{ value }">
        <div class="capitalize">
          {{ value }}
        </div>
      </template>

      <template #email="{ value }">
        {{ value }}
      </template>

      <template #status="{ value }">
        <Badge
          class="text-xs uppercase"
          size="sm"
          :variant="value === 'active' ? 'outline' : 'destructive'"
        >
          {{ value }}
        </Badge>
      </template>

      <template #actions="{ data, row }">
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
            <DropdownMenuItem>操作积分</DropdownMenuItem>
            <DropdownMenuItem>封禁</DropdownMenuItem>
            <DropdownMenuItem @click="row.toggleExpanded()">查看积分账户</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </template>

      <template #expanded="{ data }">
        <div v-for="pointAccount in data.pointAccounts">
          {{ pointAccount.pointType?.name }}
          {{ pointAccount.balance }}
        </div>
      </template>
    </DataTable>
  </div>
</template>
