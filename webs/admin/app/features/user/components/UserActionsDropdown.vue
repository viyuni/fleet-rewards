<script setup lang="ts">
import { Button } from '@web/ui/components/ui/button';
import { MoreHorizontal } from 'lucide-vue-next';

import { useBanUser, useRestoreUser } from '../mutations';

interface UserActionTarget {
  id: string;
  status: 'active' | 'banned';
}

const props = defineProps<{
  user: UserActionTarget;
}>();

const emit = defineEmits<{
  viewPointAccounts: [];
}>();

const { mutate: banUser, isLoading: isBanningUser } = useBanUser();
const { mutate: restoreUser, isLoading: isRestoringUser } = useRestoreUser();

function toggleUserStatus() {
  if (props.user.status === 'active') {
    banUser(props.user.id);
  } else {
    restoreUser(props.user.id);
  }
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" class="h-8 w-8 p-0">
        <span class="sr-only">打开菜单</span>
        <MoreHorizontal class="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-50">
      <DropdownMenuLabel>操作</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem>操作积分</DropdownMenuItem>
      <DropdownMenuItem :disabled="isBanningUser || isRestoringUser" @click="toggleUserStatus">
        {{ user.status === 'active' ? '封禁' : '恢复' }}
      </DropdownMenuItem>
      <DropdownMenuItem @click="emit('viewPointAccounts')">查看积分账户</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
