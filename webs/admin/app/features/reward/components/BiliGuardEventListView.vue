<script lang="ts">
import type { Treaty } from '@elysia/eden';
import type { BiliEventPageQuery } from '@internal/shared/reward';
import type { ColumnDef } from '@tanstack/vue-table';
import { Button } from '@web/ui/components/ui/button';
import { DataTable } from '@web/ui/components/ui/table';
import { RotateCcw } from 'lucide-vue-next';

import { useDebouncedPageQuery } from '~/composables/useDebouncedPageQuery';
import { usePageQuery } from '~/composables/usePageQuery';
import type { AdminApi } from '~/plugins/api';

import { useReplayBiliGuardReward } from '../mutations';
import { biliGuardEventPageQuery } from '../queries';

export type BiliGuardEventListPage = Treaty.Data<AdminApi['rewards']['biliGuard']['get']>;
export type BiliGuardEvent = NonNullable<BiliGuardEventListPage>['items'][number];
</script>

<script setup lang="ts">
const columns = [
  { accessorKey: 'biliEventId', header: '事件 ID' },
  { accessorKey: 'biliUid', header: 'UID' },
  { accessorKey: 'user.username', header: '用户' },
  { accessorKey: 'status', header: '状态' },
  { accessorKey: 'retryCount', header: '重试次数' },
  { accessorKey: 'occurredAt', header: '发生时间' },
  { accessorKey: 'processedAt', header: '处理时间' },
  { id: 'actions', enableHiding: false },
] satisfies ColumnDef<BiliGuardEvent>[];

const {
  stateRefs: { page, pageSize, keyword, status },
  query,
} = useDebouncedPageQuery<BiliEventPageQuery>({
  status: undefined,
  startTime: undefined,
  endTime: undefined,
});

const { items: events, meta } = usePageQuery(() => biliGuardEventPageQuery(query.value));
const { mutate: replayBiliGuardReward, isLoading: isReplaying } = useReplayBiliGuardReward();

const statusLabel: Record<string, string> = {
  processing: '处理中',
  succeeded: '成功',
  failed: '失败',
  ignored: '已忽略',
};
</script>

<template>
  <DataTable
    v-model:page="page"
    :data="events"
    :columns="columns"
    :total="meta?.total"
    :page-size="pageSize"
  >
    <template #toolbar>
      <div class="flex w-full flex-wrap items-center gap-2">
        <Input
          class="max-w-xs"
          placeholder="搜索事件 ID / UID"
          v-model:model-value.trim="keyword"
        />
        <NativeSelect v-model:model-value="status">
          <NativeSelectOption value="">事件状态</NativeSelectOption>
          <NativeSelectOption value="processing">处理中</NativeSelectOption>
          <NativeSelectOption value="succeeded">成功</NativeSelectOption>
          <NativeSelectOption value="failed">失败</NativeSelectOption>
          <NativeSelectOption value="ignored">已忽略</NativeSelectOption>
        </NativeSelect>
      </div>
    </template>

    <template #status="{ value }">
      <Badge
        size="sm"
        :variant="
          value === 'failed' ? 'destructive' : value === 'succeeded' ? 'outline' : 'secondary'
        "
      >
        {{ statusLabel[value] ?? value }}
      </Badge>
    </template>

    <template #occurredAt="{ value }">
      {{ value.toLocaleString() ?? '-' }}
    </template>

    <template #processedAt="{ value }">
      {{ value?.toLocaleString() ?? '-' }}
    </template>

    <template #actions="{ rowData }">
      <Button
        variant="ghost"
        size="sm"
        :disabled="isReplaying"
        @click="replayBiliGuardReward(rowData.biliEventId)"
      >
        <RotateCcw />
        回放奖励
      </Button>
    </template>
  </DataTable>
</template>
