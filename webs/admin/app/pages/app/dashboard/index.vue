<script setup lang="ts">
import { useAuthStore } from '~/features/auth/store';

definePageMeta({ title: 'Dashboard' });

const { user } = storeToRefs(useAuthStore());
</script>

<template>
  <div>{{ user }}</div>
</template>
