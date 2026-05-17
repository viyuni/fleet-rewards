<script setup lang="ts">
import type { SidebarProps } from '@web/ui/components/ui/sidebar';

import { menus } from '~/configs/menus';
import { useAuthStore } from '~/features/auth/store';
import type { MenuItem } from '~/types';

import { version } from '../../package.json';

const props = defineProps<SidebarProps>();

const { user } = storeToRefs(useAuthStore());
const isSuperAdmin = computed(() => user.value?.role === 'superAdmin');

function canShowMenuItem(item: { superAdminOnly?: boolean }) {
  return !item.superAdminOnly || isSuperAdmin.value;
}

const visibleMenus = computed(() =>
  (menus as MenuItem[])
    .map<MenuItem | null>(item => {
      if (!canShowMenuItem(item)) {
        return null;
      }

      if (!item.items) {
        return item;
      }

      const items = item.items.filter(canShowMenuItem);

      return items.length > 0 ? { ...item, items } : null;
    })
    .filter(item => item !== null),
);
</script>

<template>
  <Sidebar v-bind="props" collapsible="offcanvas">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" as-child>
            <a href="#" class="flex items-center gap-3">
              <div class="flex aspect-square items-center justify-center rounded-lg">
                <ViyuniIcon width="28" height="28" />
              </div>

              <div class="flex flex-col gap-0.5 leading-tight">
                <span class="text-sm font-semibold">Guard Rewards</span>
                <span class="text-muted-foreground text-xs italic">v{{ version }}</span>
              </div>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
    <SidebarContent>
      <AppSidebarMenu :items="visibleMenus" />
    </SidebarContent>
    <SidebarFooter>
      <!-- Footer -->
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>
