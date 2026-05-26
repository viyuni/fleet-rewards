<script setup lang="ts">
const { $api } = useNuxtApp();

const page = ref(1);

const {
  public: { apiBaseUrl },
} = useRuntimeConfig();

const { data } = useQuery({
  key: () => ['products', page.value],
  async query() {
    return $api.products
      .get({ query: { pageSize: 50, page: page.value } })
      .then(({ data }) => data);
  },
});
</script>

<template>
  <div
    class="container mx-auto grid grid-cols-2 gap-10 p-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
  >
    <div v-for="item in data?.items" class="w-full">
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
      <div><Button class="w-full">Buy</Button></div>
    </div>
  </div>
</template>
