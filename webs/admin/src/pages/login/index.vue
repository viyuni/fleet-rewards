<script setup lang="ts"></script>

<template>
  <div class="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
    <div class="flex w-full max-w-sm flex-col gap-6">
      <a
        href="https://viyuni.top"
        target="_blank"
        class="flex items-center gap-1 self-center font-medium uppercase"
      >
        <ViyuniLogo />
      </a>
      <LoginForm />
    </div>

    <FluidCursor class="-z-1 opacity-50" />
  </div>
</template>
