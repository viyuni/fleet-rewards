<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

const route = useRoute();

const breadcrumbs = computed(() => {
  return route.matched
    .filter(item => item.meta.title)
    .map(item => ({
      title: item.meta.title as string,
      to: item.path,
    }));
});
</script>

<template>
  <SidebarProvider>
    <AppSidebar />

    <SidebarInset>
      <header class="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger />
        <Separator orientation="vertical" class="my-auto mr-2 h-4" />

        <Breadcrumb>
          <BreadcrumbList>
            <template v-for="(item, index) in breadcrumbs" :key="item.to">
              <BreadcrumbItem>
                <BreadcrumbPage v-if="index === breadcrumbs.length - 1">
                  {{ item.title }}
                </BreadcrumbPage>

                <BreadcrumbLink v-else as-child>
                  <RouterLink :to="item.to">
                    {{ item.title }}
                  </RouterLink>
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator v-if="index < breadcrumbs.length - 1" class="hidden md:block" />
            </template>
          </BreadcrumbList>
        </Breadcrumb>

        <ThemeToggle class="ml-auto" />
      </header>

      <div>
        <RouterView />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
