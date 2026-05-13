<script setup lang="ts">
import { useDark, useStorage, useToggle } from '@vueuse/core';
import { Button } from '@web/ui/components/ui/button';
import { Moon, Sun } from 'lucide-vue-next';

const isDark = useDark({
  storageKey: 'theme',
  valueDark: 'dark',
  valueLight: 'light',
});

const toggleDark = useToggle(isDark);

function handleToggleTheme() {
  toggleDark();
}
</script>

<template>
  <Button @click="handleToggleTheme" variant="ghost" size="icon-sm">
    <Sun v-if="isDark"></Sun>
    <Moon v-else></Moon>
  </Button>
</template>
