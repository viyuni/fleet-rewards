<script setup lang="ts">
import { Repeat2, WalletCards } from 'lucide-vue-next';

defineProps<{
  isAuthenticated: boolean;
  balances?: any[] | null;
}>();

const emit = defineEmits<{
  login: [];
  refreshBalances: [];
  openConversion: [];
}>();
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-2">
    <button
      class="rounded-lg border border-[#f2d3b8] bg-[#fffdf8] p-4 text-left shadow-sm"
      @click="isAuthenticated ? emit('refreshBalances') : emit('login')"
    >
      <div class="mb-2 flex items-center gap-2 text-sm text-[#8a5a36]">
        <WalletCards class="size-4" />
        积分余额
      </div>
      <div v-if="isAuthenticated && balances?.length" class="space-y-1">
        <div
          v-for="account in balances"
          :key="account.id"
          class="flex items-baseline justify-between gap-3"
        >
          <span class="truncate text-sm">{{ account.pointType?.name ?? '积分' }}</span>
          <span class="text-xl font-bold text-[#b22f0f]">{{ account.balance }}</span>
        </div>
      </div>
      <div v-else class="text-sm text-[#9b7658]">
        {{ isAuthenticated ? '暂无积分' : '登录后查看' }}
      </div>
    </button>

    <button
      class="rounded-lg border border-[#f2d3b8] bg-[#fffdf8] p-4 text-left shadow-sm"
      @click="isAuthenticated ? emit('openConversion') : emit('login')"
    >
      <div class="mb-2 flex items-center gap-2 text-sm text-[#8a5a36]">
        <Repeat2 class="size-4" />
        积分转换
      </div>
      <div class="text-sm text-[#9b7658]">按规则兑换积分</div>
    </button>
  </div>
</template>
