<script setup lang="ts">
import { LogIn, RefreshCcw } from 'lucide-vue-next';
import { v7 } from 'uuid';
import { toast } from 'vue-sonner';

import UserAccountDropdown from '../features/account/components/UserAccountDropdown.vue';
import UserAuthDialog from '../features/account/components/UserAuthDialog.vue';
import UserProfileDialog from '../features/account/components/UserProfileDialog.vue';
import UserOrdersDialog from '../features/order/components/UserOrdersDialog.vue';
import UserPurchaseDetailDialog from '../features/order/components/UserPurchaseDetailDialog.vue';
import UserPointActions from '../features/point/components/UserPointActions.vue';
import UserPointConversionDialog from '../features/point/components/UserPointConversionDialog.vue';
import UserPointTransactionsDialog from '../features/point/components/UserPointTransactionsDialog.vue';
import UserProductGrid from '../features/product/components/UserProductGrid.vue';

const { $api } = useNuxtApp();

const {
  public: { apiBaseUrl },
} = useRuntimeConfig();

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
const currentUser = ref<any>(null);
const purchasedOrderNo = ref<string>();
const purchasedOrderDetail = ref<string>();

const isAuthenticated = computed(() => Boolean(currentUser.value));

const { data: products, refetch: refetchProducts } = useQuery({
  key: () => ['products', page.value],
  async query() {
    return $api.products.get({ query: { pageSize: 50, page: page.value } }).then(res => res.data);
  },
});

const { data: balances, refetch: refetchBalances } = useQuery({
  key: () => ['pointAccounts', currentUser.value?.id],
  enabled: () => isAuthenticated.value,
  async query() {
    return $api.pointAccounts.get().then(res => res.data);
  },
});

const { data: transactions, refetch: refetchTransactions } = useQuery({
  key: () => ['pointTransactions', currentUser.value?.id],
  enabled: () => isAuthenticated.value,
  async query() {
    return $api.pointTransactions.get({ query: { pageSize: 20, page: 1 } }).then(res => res.data);
  },
});

const { data: conversionRules, refetch: refetchConversionRules } = useQuery({
  key: () => ['pointConversions', currentUser.value?.id],
  enabled: () => isAuthenticated.value,
  async query() {
    return $api.pointConversions.get().then(res => res.data);
  },
});

const { data: orders, refetch: refetchOrders } = useQuery({
  key: () => ['orders', currentUser.value?.id],
  enabled: () => isAuthenticated.value,
  async query() {
    return $api.orders.get({ query: { pageSize: 20, page: 1 } }).then(res => res.data);
  },
});

onMounted(() => {
  refreshMe();
});

function createNonce() {
  return globalThis.crypto?.randomUUID?.() ?? v7();
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

async function refreshMe() {
  try {
    currentUser.value = await $api.me.get().then(res => res.data);
    await Promise.allSettled([
      refetchBalances(),
      refetchTransactions(),
      refetchConversionRules(),
      refetchOrders(),
    ]);
  } catch {
    currentUser.value = null;
  }
}

async function logout() {
  isLoggingOut.value = true;

  try {
    await $api.auth.logout.post().then(res => res.data);
    currentUser.value = null;
    toast.success('已退出登录');
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

    await Promise.all([
      refetchProducts(),
      refetchBalances(),
      refetchTransactions(),
      refetchOrders(),
    ]);
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

const imageBaseUrl = computed(() => apiBaseUrl.replace(/\/$/, ''));

function getCoverUrl(cover: string) {
  if (!cover) {
    return undefined;
  }

  if (/^https?:\/\//.test(cover)) {
    return cover;
  }

  const imagePath = cover.startsWith('/images/') ? cover : `/images/${cover.replace(/^\/+/, '')}`;

  return `${imageBaseUrl.value}${imagePath}`;
}

async function handleAuthenticated(user: any) {
  currentUser.value = user;
  await Promise.all([
    refetchBalances(),
    refetchTransactions(),
    refetchConversionRules(),
    refetchOrders(),
  ]);
}

function handleProfileSaved(user: any) {
  currentUser.value = user;
}

async function handlePointConverted() {
  await Promise.all([refetchBalances(), refetchTransactions()]);
}
</script>

<template>
  <main class="min-h-svh pb-10 text-[#1d120b]">
    <header class="sticky top-0 z-20 border-b border-white/35 bg-[#fff]/90 backdrop-blur">
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <div>
          <div class="text-lg font-bold text-[#4b210d]">积分商城</div>
          <div class="text-xs text-[#8a5a36]">弥生miku 大航海积分兑换</div>
        </div>

        <div class="flex items-center gap-2">
          <Button v-if="!isAuthenticated" size="sm" @click="openAuthDialog('login')">
            <LogIn class="size-4" />
            登录/注册
          </Button>
          <UserAccountDropdown
            v-else
            :user="currentUser"
            :is-logging-out="isLoggingOut"
            @edit-profile="profileDialogOpen = true"
            @view-transactions="transactionsDialogOpen = true"
            @view-orders="ordersDialogOpen = true"
            @logout="logout"
          />
        </div>
      </div>
    </header>

    <section class="mx-auto max-w-7xl px-4 py-5">
      <div class="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <UserPointActions
          :is-authenticated="isAuthenticated"
          :balances="balances"
          @login="openAuthDialog('login')"
          @refresh-balances="refetchBalances"
          @open-conversion="conversionDialogOpen = true"
        />
      </div>
    </section>

    <UserProductGrid
      :products="products"
      :buying-product-id="buyingProductId"
      :get-cover-url="getCoverUrl"
      @buy="buyProduct"
    />

    <UserAuthDialog
      v-model:open="authDialogOpen"
      :auth-mode="authMode"
      @update:auth-mode="authMode = $event"
      @authenticated="handleAuthenticated"
    />

    <UserProfileDialog
      v-model:open="profileDialogOpen"
      :user="currentUser"
      @saved="handleProfileSaved"
    />

    <UserPointTransactionsDialog
      v-model:open="transactionsDialogOpen"
      :transactions="transactions"
      :format-date="formatDate"
    />

    <UserPointConversionDialog
      v-model:open="conversionDialogOpen"
      :rules="conversionRules"
      @converted="handlePointConverted"
    />

    <UserOrdersDialog v-model:open="ordersDialogOpen" :orders="orders" :format-date="formatDate" />

    <UserPurchaseDetailDialog
      v-model:open="purchaseDetailDialogOpen"
      :order-no="purchasedOrderNo"
      :detail="purchasedOrderDetail"
    />
  </main>
</template>
