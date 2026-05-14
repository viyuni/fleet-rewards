<script lang="ts">
import type { Treaty } from '@elysia/eden';
import type { UserPageQuery } from '@internal/shared/user';
import type { ColumnDef } from '@tanstack/vue-table';
import { Button } from '@web/ui/components/ui/button';
import { DataTable } from '@web/ui/components/ui/table';
import { MoreHorizontal } from 'lucide-vue-next';

import { useDebouncedPageQuery } from '~/composables/useDebouncedPageQuery';
import { usePageQuery } from '~/composables/usePageQuery';
import type { AdminApi } from '~/plugins/api';

import { userPageQuery } from '../queries/user';

export type UserListPage = Treaty.Data<AdminApi['users']['get']>;
export type User = NonNullable<UserListPage>['items'][number];
</script>

<script setup lang="ts">
const columns: ColumnDef<User>[] = [
  { accessorKey: 'biliUid', header: 'UID' },
  { accessorKey: 'username', header: '用户名' },
  { accessorKey: 'email', header: '邮箱' },
  { accessorKey: 'phone', header: '手机号' },
  { accessorKey: 'address', header: '地址' },
  { accessorKey: 'status', header: '状态' },
  { id: 'actions', enableHiding: false },
];

const userStatusOptions = [
  { label: '正常', value: 'active' },
  { label: '封禁', value: 'banned' },
] as const;

const {
  stateRefs: { page, pageSize, keyword, status },
  query,
} = useDebouncedPageQuery<UserPageQuery>({
  status: undefined,
});

const { items: users, meta: userMeta } = usePageQuery(() => userPageQuery(query.value));
</script>

<template>
  <DataTable
    v-model:page="page"
    :data="users"
    :columns="columns"
    :total="userMeta?.total"
    :page-size="pageSize"
  >
    <template #toolbar>
      <div class="flex w-full items-center gap-2">
        <Input class="max-w-xs" placeholder="搜索用户名 / UID" v-model:model-value.trim="keyword" />

        <NativeSelect v-model:model-value="status">
          <NativeSelectOption value="">选择用户状态</NativeSelectOption>
          <NativeSelectOption
            v-for="option in userStatusOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </NativeSelectOption>
        </NativeSelect>
      </div>
    </template>

    <template #username="{ value }">
      <div class="capitalize">{{ value }}</div>
    </template>

    <template #status="{ value }">
      <Badge
        class="text-xs uppercase"
        size="sm"
        :variant="value === 'active' ? 'outline' : 'destructive'"
      >
        {{ value === 'active' ? '正常' : '封禁' }}
      </Badge>
    </template>

    <template #actions="{ row }">
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
      <div class="space-y-1">
        <div v-for="pointAccount in data.pointAccounts" :key="pointAccount.id">
          {{ pointAccount.pointType?.name }}：{{ pointAccount.balance }}
        </div>
      </div>
    </template>
  </DataTable>
</template>
