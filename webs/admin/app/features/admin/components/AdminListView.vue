<script lang="ts">
import type { Treaty } from '@elysia/eden';
import type { AdminPageQuery } from '@internal/shared/admin';
import type { ColumnDef } from '@tanstack/vue-table';
import { Button } from '@web/ui/components/ui/button';
import { DataTable } from '@web/ui/components/ui/table';
import { MoreHorizontal } from 'lucide-vue-next';

import { useDebouncedPageQuery } from '~/composables/useDebouncedPageQuery';
import { usePageQuery } from '~/composables/usePageQuery';
import type { AdminApi } from '~/plugins/api';

import { adminPageQuery } from '../queries/admin';

export type AdminListPage = Treaty.Data<AdminApi['admin']['get']>;
export type Admin = NonNullable<AdminListPage>['items'][number];
</script>

<script setup lang="ts">
const columns: ColumnDef<Admin>[] = [
  { accessorKey: 'uid', header: 'UID' },
  { accessorKey: 'username', header: '用户名' },
  { accessorKey: 'role', header: '角色' },
  { accessorKey: 'status', header: '状态' },
  { accessorKey: 'lastLoginAt', header: '最后登录' },
  { accessorKey: 'remark', header: '备注' },
  { id: 'actions', enableHiding: false },
];

const {
  stateRefs: { page, pageSize },
  query,
} = useDebouncedPageQuery<AdminPageQuery>();

const { items: admins, meta: adminMeta } = usePageQuery(() => adminPageQuery(query.value));
</script>

<template>
  <DataTable
    v-model:page="page"
    :data="admins"
    :columns="columns"
    :total="adminMeta?.total"
    :page-size="pageSize"
  >
    <template #role="{ value }">
      <Badge size="sm" variant="secondary">{{
        value === 'superAdmin' ? '超级管理员' : '管理员'
      }}</Badge>
    </template>

    <template #status="{ value }">
      <Badge size="sm" :variant="value === 'active' ? 'outline' : 'destructive'">
        {{ value === 'active' ? '正常' : '封禁' }}
      </Badge>
    </template>

    <template #lastLoginAt="{ value }">
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
          <DropdownMenuItem>重置密码</DropdownMenuItem>
          <DropdownMenuItem>封禁 / 解封</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </template>
  </DataTable>
</template>
