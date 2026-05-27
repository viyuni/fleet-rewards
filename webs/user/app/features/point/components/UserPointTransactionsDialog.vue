<script setup lang="ts">
defineProps<{
  transactions?: { items?: any[] } | null;
  formatDate: (value?: string | Date | null) => string;
}>();

const open = defineModel<boolean>('open', { required: true });
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>积分流水</DialogTitle>
        <DialogDescription>最近 20 条积分变动。</DialogDescription>
      </DialogHeader>

      <div class="max-h-[60vh] space-y-2 overflow-auto pr-1">
        <div v-for="item in transactions?.items" :key="item.id" class="rounded-lg border p-3">
          <div class="flex items-center justify-between gap-3">
            <div class="font-medium">{{ item.title }}</div>
            <div :class="item.delta >= 0 ? 'text-emerald-600' : 'text-red-600'">
              {{ item.delta >= 0 ? '+' : '' }}{{ item.delta }}
            </div>
          </div>
          <div class="text-muted-foreground mt-1 text-xs">
            {{ item.pointTypeNameSnapshot }} · {{ formatDate(item.createdAt) }} · 余额
            {{ item.balanceAfter }}
          </div>
        </div>
        <div
          v-if="!transactions?.items?.length"
          class="text-muted-foreground py-8 text-center text-sm"
        >
          暂无流水
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
