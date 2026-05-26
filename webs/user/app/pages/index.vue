<script setup lang="ts">
import { toast } from 'vue-sonner';

const { $api } = useNuxtApp();

const page = ref(1);
const buyingProductId = ref<string>();

const {
  public: { apiBaseUrl },
} = useRuntimeConfig();

const { data, refetch } = useQuery({
  key: () => ['products', page.value],
  async query() {
    return $api.products
      .get({ query: { pageSize: 50, page: page.value } })
      .then(({ data }) => data);
  },
});

function createNonce() {
  return (
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return '购买失败，请稍后再试';
}

async function buyProduct(productId: string) {
  buyingProductId.value = productId;

  try {
    const { data, error } = await $api.orders.post({
      productId,
      nonce: createNonce(),
    });

    if (error) {
      throw error.value;
    }

    toast.success(`购买成功，订单号：${data?.orderNo}`);
    await refetch();
  } catch (error) {
    toast.error(getErrorMessage(error));
  } finally {
    buyingProductId.value = undefined;
  }
}
</script>

<template>
  <div
    class="container mx-auto grid grid-cols-2 gap-10 p-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
  >
    <div v-for="item in data?.items" :key="item.id" class="w-full">
      <div
        class="aspect-square w-full overflow-hidden rounded-md"
        :style="{
          backgroundImage: item.coverPlaceholderUrl
            ? `url(${item.coverPlaceholderUrl})`
            : undefined,
          backgroundColor: item.coverPlaceholderUrl ? undefined : '#000',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
        }"
      >
        <img
          v-if="item.cover"
          :src="`${apiBaseUrl}images/${item.cover}`"
          class="w-full"
          loading="lazy"
        />
      </div>
      <div>
        {{ item.name }}
      </div>
      <div class="text-muted-foreground text-sm">
        {{ item.price }} {{ item.pointType?.name ?? '积分' }}
      </div>
      <div>
        <Button
          class="w-full"
          :disabled="buyingProductId === item.id || item.stock <= 0"
          @click="buyProduct(item.id)"
        >
          {{ buyingProductId === item.id ? '购买中...' : item.stock <= 0 ? '已售罄' : '购买' }}
        </Button>
      </div>
    </div>
  </div>
</template>
