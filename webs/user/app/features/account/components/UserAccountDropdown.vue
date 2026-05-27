<script setup lang="ts">
import { LogOut, ReceiptText, ShoppingBag, UserRound } from 'lucide-vue-next';

defineProps<{
  user: any;
  isLoggingOut?: boolean;
}>();

const emit = defineEmits<{
  editProfile: [];
  viewTransactions: [];
  viewOrders: [];
  logout: [];
}>();
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button class="max-w-44">
        <UserRound class="size-4 shrink-0" />
        <span class="truncate">{{ user?.username ?? '用户' }}</span>
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent align="end" class="w-52">
      <DropdownMenuLabel>
        <div class="text-foreground truncate text-base">{{ user?.username ?? '用户' }}</div>
        <div class="text-muted-foreground truncate text-xs font-normal">
          UID {{ user?.biliUid ?? user?.uid ?? '-' }}
        </div>
      </DropdownMenuLabel>

      <DropdownMenuSeparator />

      <DropdownMenuItem @click="emit('editProfile')">
        <UserRound />
        个人信息
      </DropdownMenuItem>

      <DropdownMenuItem @click="emit('viewTransactions')">
        <ReceiptText />
        我的积分流水
      </DropdownMenuItem>

      <DropdownMenuItem @click="emit('viewOrders')">
        <ShoppingBag />
        我的订单
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem variant="destructive" :disabled="isLoggingOut" @click="emit('logout')">
        <LogOut />
        退出登录
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
