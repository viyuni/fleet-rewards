<script setup lang="ts">
defineProps<{
  orders?: { items?: any[] } | null;
  formatDate: (value?: string | Date | null) => string;
}>();

const open = defineModel<boolean>('open', { required: true });
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>我的订单</DialogTitle>
        <DialogDescription>最近 20 条兑换订单。</DialogDescription>
      </DialogHeader>

      <div class="max-h-[60vh] space-y-2 overflow-auto pr-1">
        <div v-for="item in orders?.items" :key="item.id" class="rounded-lg border p-3">
          <div class="flex items-center justify-between gap-3">
            <div class="font-medium">{{ item.productNameSnapshot }}</div>
            <Badge variant="outline">{{ item.status }}</Badge>
          </div>
          <div class="text-muted-foreground mt-1 text-xs">
            {{ item.orderNo }} · {{ item.price }} {{ item.pointTypeNameSnapshot }} ·
            {{ formatDate(item.completedAt ?? item.refundedAt) }}
          </div>
          <div v-if="item.expressCompany || item.expressNo" class="mt-2 text-sm">
            {{ item.expressCompany }} {{ item.expressNo }}
          </div>
        </div>
        <div v-if="!orders?.items?.length" class="text-muted-foreground py-8 text-center text-sm">
          暂无订单
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
