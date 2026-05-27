<script setup lang="ts">
import { ShoppingBag } from 'lucide-vue-next';

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
    class="container mx-auto grid grid-cols-2 gap-4 px-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
  >
    <div
      v-for="item in products?.items"
      :key="item.id"
      class="w-full rounded-lg border border-[#f2d3b8] bg-[#fffdf8] p-2 shadow-sm"
    >
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
        <img v-if="item.cover" :src="getCoverUrl(item.cover)" class="w-full" loading="lazy" />
      </div>

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
    </div>
  </section>
</template>
