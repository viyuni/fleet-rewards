<script setup lang="ts">
defineOptions({
  name: 'ProductCover',
});

type ProductCoverFit = 'cover' | 'contain';

type Props = {
  src?: string | null;
  placeholder?: string | null;
  alt?: string;
  fit?: ProductCoverFit;
};

const props = withDefaults(defineProps<Props>(), {
  src: null,
  placeholder: null,
  alt: '',
  fit: 'cover',
});
</script>

<template>
  <div
    class="product-cover"
    :style="{
      '--product-cover-fit': props.fit,
      backgroundImage: props.placeholder ? `url(${props.placeholder})` : undefined,
      backgroundRepeat: 'no-repeat',
      backgroundSize: props.fit,
      backgroundPosition: 'center',
    }"
  >
    <img
      v-if="props.src"
      class="product-cover__image"
      :src="props.src"
      :alt="props.alt"
      loading="lazy"
      draggable="false"
    />
  </div>
</template>

<style scoped>
.product-cover {
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;

  overflow: hidden;
  background-color: #000;

  mask-image: url('~/assets/masks/product-cover-mask.svg');
  mask-size: 100% 100%;
  mask-repeat: no-repeat;
  mask-position: center;

  -webkit-mask-image: url('~/assets/masks/product-cover-mask.svg');
  -webkit-mask-size: 100% 100%;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
}

.product-cover__image {
  display: block;
  width: 100%;
  height: 100%;

  object-fit: var(--product-cover-fit);
  object-position: center;

  user-select: none;
  pointer-events: none;
}
</style>
