<script setup lang="ts" generic="TData">
import type {
  Cell,
  ColumnDef,
  ColumnFiltersState,
  Header,
  Row,
  SortingState,
  Table as TanStackTable,
  VisibilityState,
} from '@tanstack/vue-table';
import {
  FlexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from '@tanstack/vue-table';
import type { HTMLAttributes } from 'vue';
import { computed, ref } from 'vue';

import {
  Pagination,
  PaginationContent,
  PaginationPrevious,
  PaginationItem,
  PaginationEllipsis,
  PaginationNext,
} from '#ui/components/ui/pagination';
import { cn } from '#ui/lib/utils';

import { valueUpdater } from '../../ui/table';
import {
  TableRow,
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
} from '../../ui/table';

type DataTableCellSlotProps<TData, TValue = unknown> = {
  cell: Cell<TData, unknown>;
  row: Row<TData>;
  table: TanStackTable<TData>;
  value: TValue;
  data: TData;
};

type DataTableHeaderSlotProps<TData> = {
  header: Header<TData, unknown>;
  table: TanStackTable<TData>;
};

type DataTableControlSlotProps<TData> = {
  table: TanStackTable<TData>;
};

type DataTableSlots<TData> = {
  actions?: (props: DataTableCellSlotProps<TData>) => unknown;
  'actions-header'?: (props: DataTableHeaderSlotProps<TData>) => unknown;
  default?: (props: DataTableControlSlotProps<TData>) => unknown;
  empty?: () => unknown;
  footer?: (props: DataTableControlSlotProps<TData>) => unknown;
  toolbar?: (props: DataTableControlSlotProps<TData>) => unknown;
  expanded?: (props: { row: Row<TData>; data: TData }) => unknown;
  select?: (props: DataTableCellSlotProps<TData>) => unknown;
  'select-header'?: (props: DataTableHeaderSlotProps<TData>) => unknown;
} & {
  [Key in keyof TData]?: (props: DataTableCellSlotProps<TData, TData[Key]>) => unknown;
} & {
  [Key in keyof TData as `${Key & string}-header`]?: (
    props: DataTableHeaderSlotProps<TData>,
  ) => unknown;
} & {
  [key: string]: ((props: any) => unknown) | undefined;
};

const props = withDefaults(
  defineProps<{
    columns?: ColumnDef<TData>[];
    data?: TData[];
    table?: TanStackTable<TData>;
    emptyText?: string;
    class?: HTMLAttributes['class'];
  }>(),
  {
    columns: () => [],
    data: () => [],
    emptyText: 'No results.',
  },
);

const slots = defineSlots<DataTableSlots<TData>>();

const sorting = ref<SortingState>([]);
const columnFilters = ref<ColumnFiltersState>([]);
const columnVisibility = ref<VisibilityState>({});
const rowSelection = ref({});
const expanded = ref({});

const internalTable = useVueTable({
  get data() {
    return props.data;
  },
  get columns() {
    return props.columns;
  },
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  onSortingChange: updaterOrValue => valueUpdater(updaterOrValue, sorting),
  onColumnFiltersChange: updaterOrValue => valueUpdater(updaterOrValue, columnFilters),
  onColumnVisibilityChange: updaterOrValue => valueUpdater(updaterOrValue, columnVisibility),
  onRowSelectionChange: updaterOrValue => valueUpdater(updaterOrValue, rowSelection),
  onExpandedChange: updaterOrValue => valueUpdater(updaterOrValue, expanded),
  state: {
    get sorting() {
      return sorting.value;
    },
    get columnFilters() {
      return columnFilters.value;
    },
    get columnVisibility() {
      return columnVisibility.value;
    },
    get rowSelection() {
      return rowSelection.value;
    },
    get expanded() {
      return expanded.value;
    },
  },
});

const resolvedTable = computed(() => props.table ?? internalTable);
const visibleColumnCount = computed(() => resolvedTable.value.getVisibleLeafColumns().length || 1);

function hasColumnSlot(columnId: string) {
  return columnId in slots;
}

function hasHeaderSlot(columnId: string) {
  return `${columnId}-header` in slots;
}

function getColumnSlotName(columnId: string) {
  return columnId as keyof DataTableSlots<TData> & string;
}

function getHeaderSlotName(columnId: string) {
  return `${columnId}-header` as keyof DataTableSlots<TData> & string;
}

function getColumnSlotValue(cell: Cell<TData, unknown>) {
  return cell.getValue() as TData[keyof TData & string];
}
</script>

<template>
  <slot :table="resolvedTable" />
  <slot name="toolbar" :table="resolvedTable" />

  <div :class="cn('rounded-md border', props.class)">
    <Table>
      <TableHeader>
        <TableRow v-for="headerGroup in resolvedTable.getHeaderGroups()" :key="headerGroup.id">
          <TableHead v-for="header in headerGroup.headers" :key="header.id">
            <slot
              v-if="!header.isPlaceholder && hasHeaderSlot(header.column.id)"
              :name="getHeaderSlotName(header.column.id)"
              :header="header"
              :table="resolvedTable"
            />
            <FlexRender
              v-else-if="!header.isPlaceholder"
              :render="header.column.columnDef.header"
              :props="header.getContext()"
            />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <template v-if="resolvedTable.getRowModel().rows?.length">
          <template v-for="row in resolvedTable.getRowModel().rows" :key="row.id">
            <TableRow :data-state="row.getIsSelected() && 'selected'">
              <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                <slot
                  v-if="hasColumnSlot(cell.column.id)"
                  :name="getColumnSlotName(cell.column.id)"
                  :cell="cell"
                  :row="row"
                  :table="resolvedTable"
                  :value="getColumnSlotValue(cell)"
                  :data="row.original"
                />
                <FlexRender
                  v-else
                  :render="cell.column.columnDef.cell"
                  :props="cell.getContext()"
                />
              </TableCell>
            </TableRow>
            <TableRow v-if="$slots.expanded && row.getIsExpanded()">
              <TableCell :colspan="row.getVisibleCells().length || visibleColumnCount">
                <slot name="expanded" :row="row" :data="row.original" />
              </TableCell>
            </TableRow>
          </template>
        </template>

        <TableEmpty v-else :colspan="visibleColumnCount" class="h-24 text-center">
          <slot name="empty">
            {{ emptyText }}
          </slot>
        </TableEmpty>
      </TableBody>
    </Table>
  </div>

  <slot name="footer" :table="resolvedTable" />

  <Pagination v-slot="{ page }" :items-per-page="10" :total="30" :default-page="2">
    <PaginationContent v-slot="{ items }">
      <PaginationPrevious />
      <template v-for="(item, index) in items" :key="index">
        <PaginationItem
          v-if="item.type === 'page'"
          :value="item.value"
          :is-active="item.value === page"
        >
          {{ item.value }}
        </PaginationItem>
      </template>
      <PaginationEllipsis :index="4" />
      <PaginationNext />
    </PaginationContent>
  </Pagination>
</template>
