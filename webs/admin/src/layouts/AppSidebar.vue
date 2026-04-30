<script setup lang="ts">
import type { SidebarProps } from '@web/ui/sidebar';

import { menus } from '#web/admin/configs/menus';

import { version } from '../../package.json';

const props = defineProps<SidebarProps>();
</script>

<template>
  <Sidebar v-bind="props">
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
      <AppSidebarMenu :items="menus" />
    </SidebarContent>
    <SidebarFooter>
      <!-- Footer -->
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>
