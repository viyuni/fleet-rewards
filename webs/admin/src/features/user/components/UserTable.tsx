import type { Treaty } from '@elysia/eden';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@web/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@web/ui/table';
import { computed, ref } from 'vue';
import { defineComponent } from 'vue-jsx-vapor';

import { api } from '#eden';

export type UserListPage = Treaty.Data<typeof api.users.get>;
type UserListItem = NonNullable<UserListPage>['items'][number];
type PaginationPageSlot = { page: number };
type PaginationContentSlot = {
  items: Array<{ type: 'page'; value: number } | { type: 'ellipsis'; value?: number }>;
};

const pageSize = 20;
const visibleColumnCount = 8;

function displayValue(value: string | null | undefined) {
  return value?.trim() || '-';
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getStatusLabel(status: UserListItem['status']) {
  return status === 'active' ? '正常' : '已封禁';
}

function getStatusClass(status: UserListItem['status']) {
  return status === 'active'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-rose-200 bg-rose-50 text-rose-700';
}

export const UserTable = defineComponent(() => {
  const page = ref(1);
  const { data } = useQuery({
    key: () => ['users', page.value],
    query: () =>
      api.users
        .get({
          query: {
            page: page.value,
            pageSize,
          },
        })
        .then(res => res.data),
  });

  const users = computed(() => data.value?.items ?? []);
  const total = computed(() => data.value?.meta.total ?? 0);

  return () => (
    <div class="w-full space-y-4 p-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>用户名</TableHead>
            <TableHead>B站 UID</TableHead>
            <TableHead>邮箱</TableHead>
            <TableHead>手机</TableHead>
            <TableHead>地址</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>备注</TableHead>
            <TableHead>创建时间</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.value.length > 0 ? (
            users.value.map(user => (
              <TableRow key={user.id}>
                <TableCell class="font-medium">{user.username}</TableCell>
                <TableCell>{user.biliUid}</TableCell>
                <TableCell>{displayValue(user.email)}</TableCell>
                <TableCell>{displayValue(user.phone)}</TableCell>
                <TableCell class="max-w-80 truncate">{displayValue(user.address)}</TableCell>
                <TableCell>
                  <span
                    class={[
                      'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                      getStatusClass(user.status),
                    ]}
                  >
                    {getStatusLabel(user.status)}
                  </span>
                </TableCell>
                <TableCell>{displayValue(user.remark)}</TableCell>
                <TableCell>{formatDate(user.createdAt)}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableEmpty colspan={visibleColumnCount} class="h-24 text-center">
              暂无用户
            </TableEmpty>
          )}
        </TableBody>
      </Table>

      <Pagination
        v-model:page={page.value}
        itemsPerPage={data.value?.meta.pageSize ?? pageSize}
        total={total.value}
        defaultPage={1}
        v-slots={{
          default: ({ page: currentPage }: PaginationPageSlot) => (
            <PaginationContent
              v-slots={{
                default: ({ items }: PaginationContentSlot) => (
                  <>
                    <PaginationPrevious />
                    {items.map((item, index) =>
                      item.type === 'page' ? (
                        <PaginationItem
                          key={item.value}
                          value={item.value}
                          isActive={item.value === currentPage}
                        >
                          {item.value}
                        </PaginationItem>
                      ) : (
                        <PaginationEllipsis key={index} />
                      ),
                    )}
                    <PaginationNext />
                  </>
                ),
              }}
            />
          ),
        }}
      />
    </div>
  );
});
