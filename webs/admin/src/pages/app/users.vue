<script lang="ts">
import { UserTable } from '#web/admin/features/user';
</script>

<script setup lang="ts">
definePage({
  meta: {
    title: '用户管理',
  },
});
</script>

<template>
  <UserTable></UserTable>
</template>
