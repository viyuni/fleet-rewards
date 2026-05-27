<script setup lang="ts">
import { ShoppingBag } from 'lucide-vue-next';

import ProductCover from './ProductCover.vue';

defineProps<{
  products?: { items?: any[] } | null;
  buyingProductId?: string;
  getCoverUrl: (cover: string) => string | undefined;
}>();

const emit = defineEmits<{
  buy: [productId: string];
}>();
</script>

<template>
  <section
    class="container mx-auto grid grid-cols-2 gap-5 px-4 md:grid-cols-2 md:gap-13 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
  >
    <ShapeCard v-for="item in products?.items" :key="item.id" class="text-[#eabc83]">
      <ProductCover
        class="w-full"
        :src="item.cover ? getCoverUrl(item.cover) : undefined"
        :placeholder="item.coverPlaceholderUrl"
      />

      <div class="px-3 pt-4">
        <div class="truncate text-[#070402]">
          {{ item.name }}
        </div>

        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0 font-bold text-[#b22f0f]">
            <span class="pr-1 text-xl">{{ item.price }}</span>
            <span class="text-sm">{{ item.pointType?.name ?? '积分' }}</span>
          </div>

          <Button
            size="icon"
            class="shrink-0 rounded-full bg-[#eabc83] hover:bg-[#eabc83]/80"
            :disabled="buyingProductId === item.id || item.stock <= 0"
            @click="emit('buy', item.id)"
          >
            <ShoppingBag :size="22" />
          </Button>
        </div>
      </div>
    </ShapeCard>
  </section>
</template>
