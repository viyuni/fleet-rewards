<script setup lang="ts">
import type { ColumnDef } from '@tanstack/vue-table';
import { Button } from '@web/ui/button';
import { Checkbox } from '@web/ui/checkbox';
import { DataTable } from '@web/ui/table';
import { ArrowUpDown, ChevronDown, MoreHorizontal } from 'lucide-vue-next';

export interface Payment {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'success' | 'failed';
  email: string;
}

const data: Payment[] = [
  {
    id: 'm5gr84i9',
    amount: 316,
    status: 'success',
    email: 'ken99@yahoo.com',
  },
  {
    id: '3u1reuv4',
    amount: 242,
    status: 'success',
    email: 'Abe45@gmail.com',
  },
  {
    id: 'derv1ws0',
    amount: 837,
    status: 'processing',
    email: 'Monserrat44@gmail.com',
  },
  {
    id: '5kma53ae',
    amount: 874,
    status: 'success',
    email: 'Silas22@gmail.com',
  },
  {
    id: 'bhqecj4p',
    amount: 721,
    status: 'failed',
    email: 'carmella@hotmail.com',
  },
];

const columns: ColumnDef<Payment>[] = [
  {
    id: 'select',
    enableSorting: false,
    // enableHiding: false,
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    accessorKey: 'email',
  },
  {
    accessorKey: 'amount',
  },
  {
    id: 'actions',
    enableHiding: false,
  },
];

function copy(id: string) {
  navigator.clipboard.writeText(id);
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
</script>

<template>
  <div class="w-full p-5">
    <DataTable :data="data" :columns="columns">
      <template #toolbar="{ table }">
        <div class="flex items-center py-4">
          <Input
            class="max-w-sm"
            placeholder="Filter emails..."
            :model-value="table.getColumn('email')?.getFilterValue() as string"
            @update:model-value="table.getColumn('email')?.setFilterValue($event)"
          />
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="outline" class="ml-auto">
                Columns <ChevronDown class="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                v-for="column in table.getAllColumns().filter(column => column.getCanHide())"
                :key="column.id"
                class="capitalize"
                :model-value="column.getIsVisible()"
                @update:model-value="
                  value => {
                    column.toggleVisibility(!!value);
                  }
                "
              >
                {{ column.id }}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </template>

      <template #select-header="{ table }">
        <Checkbox
          :model-value="
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          "
          aria-label="Select all"
          @update:model-value="value => table.toggleAllPageRowsSelected(!!value)"
        />
      </template>

      <template #select="{ row }">
        <Checkbox
          :model-value="row.getIsSelected()"
          aria-label="Select row"
          @update:model-value="value => row.toggleSelected(!!value)"
        />
      </template>

      <template #status="{ value }">
        <div class="capitalize">
          {{ value }}
        </div>
      </template>

      <template #email-header="{ header }">
        <Button
          variant="ghost"
          @click="header.column.toggleSorting(header.column.getIsSorted() === 'asc')"
        >
          Email <ArrowUpDown class="ml-2 h-4 w-4" />
        </Button>
      </template>

      <template #email="{ value }">
        <div class="lowercase">
          {{ value }}
        </div>
      </template>

      <template #amount-header>
        <div class="text-right">Amount</div>
      </template>

      <template #amount="{ value }">
        <div class="text-right font-medium">
          {{ formatAmount(value) }}
        </div>
      </template>

      <template #actions="{ data, row }">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" class="h-8 w-8 p-0">
              <span class="sr-only">Open menu</span>
              <MoreHorizontal class="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem @click="copy(data.id)"> Copy payment ID </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem @click="row.toggleExpanded()">View payment details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </template>

      <template #expanded="{ data }">
        {{ JSON.stringify(data) }}
      </template>

      <template #footer="{ table }">
        <div class="flex items-center justify-end space-x-2 py-4">
          <div class="text-muted-foreground flex-1 text-sm">
            {{ table.getFilteredSelectedRowModel().rows.length }} of
            {{ table.getFilteredRowModel().rows.length }} row(s) selected.
          </div>
          <div class="space-x-2">
            <Button
              variant="outline"
              size="sm"
              :disabled="!table.getCanPreviousPage()"
              @click="table.previousPage()"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              :disabled="!table.getCanNextPage()"
              @click="table.nextPage()"
            >
              Next
            </Button>
          </div>
        </div>
      </template>
    </DataTable>
  </div>
</template>
