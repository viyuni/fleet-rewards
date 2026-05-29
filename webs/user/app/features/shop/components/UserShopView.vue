<script setup lang="ts">
import { createEventHook } from '@vueuse/core';
import { LogIn } from 'lucide-vue-next';
import { v7 } from 'uuid';
import { toast } from 'vue-sonner';

import UserAccountDropdown from '~/features/account/components/UserAccountDropdown.vue';
import UserAuthDialog from '~/features/account/components/UserAuthDialog.vue';
import UserProfileDialog from '~/features/account/components/UserProfileDialog.vue';
import { userQueryOptions } from '~/features/account/queries';
import UserOrdersDialog from '~/features/order/components/UserOrdersDialog.vue';
import UserPurchaseDetailDialog from '~/features/order/components/UserPurchaseDetailDialog.vue';
import UserPointActions from '~/features/point/components/UserPointActions.vue';
import UserPointConversionDialog from '~/features/point/components/UserPointConversionDialog.vue';
import UserPointTransactionsDialog from '~/features/point/components/UserPointTransactionsDialog.vue';
import UserProductGrid from '~/features/product/components/UserProductGrid.vue';

const { $api } = useNuxtApp();

const page = ref(1);
const buyingProductId = ref<string>();
const authDialogOpen = ref(false);
const authMode = ref<'login' | 'register'>('login');
const profileDialogOpen = ref(false);
const transactionsDialogOpen = ref(false);
const conversionDialogOpen = ref(false);
const ordersDialogOpen = ref(false);
const purchaseDetailDialogOpen = ref(false);
const isLoggingOut = ref(false);
const purchasedOrderNo = ref<string>();
const purchasedOrderDetail = ref<string>();

const userChangedHook = createEventHook<void>();
const { getImageUrl } = useImage();

const { data: user, refetch: refreshMe } = useQuery(
  userQueryOptions({
    headers: () => (import.meta.server ? useRequestHeaders(['cookie']) : undefined),
  }),
);

const { data: products, refetch: refetchProducts } = useQuery({
  key: () => ['products', page.value],
  async query() {
    return $api.products.get({ query: { pageSize: 50, page: page.value } }).then(res => res.data);
  },
});

const isAuthenticated = computed(() => Boolean(user.value));
const balances = computed(() => user.value?.pointAccounts ?? []);
const conversionRules = computed(() => user.value?.pointConversionRules ?? []);

const { data: transactions, refetch: refetchTransactions } = useQuery({
  key: () => ['pointTransactions', user.value?.id ?? null],
  enabled: () => isAuthenticated.value,
  async query() {
    return $api.pointTransactions.get({ query: { pageSize: 20, page: 1 } }).then(res => res.data);
  },
});

const { data: orders, refetch: refetchOrders } = useQuery({
  key: () => ['orders', user.value?.id ?? null],
  enabled: () => isAuthenticated.value,
  async query() {
    return $api.orders.get({ query: { pageSize: 20, page: 1 } }).then(res => res.data);
  },
});

userChangedHook.on(async () => {
  await Promise.all([refreshMe(), refetchProducts()]);

  if (isAuthenticated.value) {
    await Promise.all([refetchTransactions(), refetchOrders()]);
  }
});

function createNonce() {
  return v7();
}

function getErrorMessage(error: unknown, fallback = '操作失败，请稍后再试') {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return fallback;
}

function normalizeDetail(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const detail = value.trim();

  return detail ? detail : undefined;
}

function openAuthDialog(mode: 'login' | 'register' = 'login') {
  authMode.value = mode;
  authDialogOpen.value = true;
}

async function refreshUserData() {
  await userChangedHook.trigger();
}

async function logout() {
  isLoggingOut.value = true;

  try {
    await $api.auth.logout.post().then(res => res.data);
    user.value = null;
    toast.success('已退出登录');
    await refreshUserData();
  } catch (error) {
    toast.error(getErrorMessage(error, '退出失败'));
  } finally {
    isLoggingOut.value = false;
  }
}

async function buyProduct(productId: string) {
  if (!isAuthenticated.value) {
    openAuthDialog('login');
    return;
  }

  buyingProductId.value = productId;

  try {
    const order = await $api.orders
      .post({
        productId,
        nonce: createNonce(),
      })
      .then(res => res.data);

    toast.success(`购买成功，订单号：${order?.orderNo}`);

    const detail = normalizeDetail(order?.detail);

    if (detail) {
      purchasedOrderNo.value = order?.orderNo;
      purchasedOrderDetail.value = detail;
      purchaseDetailDialogOpen.value = true;
    }

    await refreshUserData();
  } catch (error) {
    toast.error(getErrorMessage(error, '购买失败，请稍后再试'));
  } finally {
    buyingProductId.value = undefined;
  }
}

function formatDate(value?: string | Date | null) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

<template>
  <main class="relative h-svh overflow-y-auto pb-10">
    <header class="sticky top-4 z-20 container mx-auto w-full px-2 md:px-0">
      <div
        class="flex items-center justify-between gap-3 rounded-full border border-white/40 bg-white/20 px-4 py-3 backdrop-blur-3xl"
      >
        <div class="flex items-center gap-2">
          <AppIcon class="size-6" />
          <div class="text-primary text-lg font-bold">积分商城</div>
        </div>

        <div class="flex items-center gap-2">
          <Button
            v-if="!isAuthenticated"
            @click="openAuthDialog('login')"
            variant="quaternary"
            class="text-primary rounded-full"
          >
            <LogIn class="size-4" />
            登录/注册
          </Button>
          <UserAccountDropdown
            v-else
            :user="user"
            :is-logging-out="isLoggingOut"
            @edit-profile="profileDialogOpen = true"
            @view-transactions="transactionsDialogOpen = true"
            @view-orders="ordersDialogOpen = true"
            @logout="logout"
          />
        </div>
      </div>
    </header>

    <section class="container mx-auto px-4 py-5">
      <div class="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <UserPointActions
          :is-authenticated="isAuthenticated"
          :balances="balances"
          @login="openAuthDialog('login')"
          @refresh-balances="refreshUserData"
          @open-conversion="conversionDialogOpen = true"
        />
      </div>
    </section>

    <UserProductGrid
      :products="products"
      :buying-product-id="buyingProductId"
      :get-cover-url="getImageUrl"
      @buy="buyProduct"
    />

    <UserAuthDialog
      v-model:open="authDialogOpen"
      :auth-mode="authMode"
      @update:auth-mode="authMode = $event"
      @authenticated="refreshUserData"
    />

    <UserProfileDialog v-model:open="profileDialogOpen" :user="user" @saved="refreshUserData" />

    <UserPointTransactionsDialog
      v-model:open="transactionsDialogOpen"
      :transactions="transactions"
      :format-date="formatDate"
    />

    <UserPointConversionDialog
      v-model:open="conversionDialogOpen"
      :rules="conversionRules"
      @converted="refreshUserData"
    />

    <UserOrdersDialog v-model:open="ordersDialogOpen" :orders="orders" :format-date="formatDate" />

    <UserPurchaseDetailDialog
      v-model:open="purchaseDetailDialogOpen"
      :order-no="purchasedOrderNo"
      :detail="purchasedOrderDetail"
    />

    <AppBackground />
  </main>
</template>
