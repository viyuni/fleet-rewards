<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next';
import type { RouteLocationRaw } from 'vue-router';

import { useSidebar } from '#ui/components/ui/sidebar';
import type { MenuItem } from '#web/admin/types';

defineProps<{
  items: MenuItem[];
}>();

const { setOpenMobile, isMobile } = useSidebar();
const route = useRoute();

function closeSidebar() {
  if (isMobile.value) {
    setOpenMobile(false);
  }
}

function isActive(to?: RouteLocationRaw) {
  if (!to) return false;
  return route.path === to;
}

function isItemActive(item: MenuItem) {
  if (item.items?.length) {
    return item.items.some(subItem => isActive(subItem.to));
  }

  return isActive(item.to);
}
</script>

<template>
  <SidebarGroup>
    <SidebarMenu>
      <Collapsible
        v-for="item in items"
        :key="item.title"
        as-child
        class="group/collapsible"
        default-open
      >
        <SidebarMenuItem>
          <CollapsibleTrigger as-child>
            <SidebarMenuButton :tooltip="item.title" as-child :is-active="isItemActive(item)">
              <RouterLink :to="item.to ?? ''" @click="item.to && closeSidebar()">
                <component :is="item.icon" v-if="item.icon" />
                <span>{{ item.title }}</span>
                <ChevronRight
                  v-if="item.items"
                  class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                />
              </RouterLink>
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent v-if="item.items">
            <SidebarMenuSub>
              <SidebarMenuSubItem v-for="subItem in item.items" :key="subItem.title">
                <SidebarMenuSubButton as-child :is-active="isItemActive(subItem)">
                  <RouterLink :to="subItem.to" @click="closeSidebar()">
                    <span>{{ subItem.title }}</span>
                  </RouterLink>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    </SidebarMenu>
  </SidebarGroup>
</template>
