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
  <div>
    <div
      class="flex items-center gap-6 px-2"
      v-if="isAuthenticated && balances?.length"
      @click="isAuthenticated ? emit('refreshBalances') : emit('login')"
    >
      <div
        v-for="account in balances"
        :key="account.id"
        class="flex items-baseline justify-between gap-3"
      >
        <span class="truncate text-sm">{{ account.pointType?.name ?? '积分' }}</span>
        <span class="text-xl font-bold text-[#b22f0f]">{{ account.balance }}</span>
      </div>

      <Button class="text-primary rounded-full" variant="ghost" size="sm">
        <Repeat2 class="size-4" />
        积分转换
      </Button>
    </div>
  </div>
</template>
