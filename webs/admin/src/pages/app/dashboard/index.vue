<script setup lang="ts">
import { useAuthStore } from '#web/admin/features/auth/store';
definePage({
  meta: {
    title: 'Dashboard',
  },
});

const { user } = storeToRefs(useAuthStore());
</script>

<template>
  {{ user }}
</template>
