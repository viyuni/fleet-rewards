<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core';
import type { AlertDialogActionProps } from 'reka-ui';
import { AlertDialogAction } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import type { ButtonVariants } from '#ui/components/ui/button';
import { buttonVariants } from '#ui/components/ui/button';
import { cn } from '#ui/lib/utils';

const props = withDefaults(
  defineProps<
    AlertDialogActionProps & {
      class?: HTMLAttributes['class'];
      variant?: ButtonVariants['variant'];
      size?: ButtonVariants['size'];
    }
  >(),
  {
    variant: 'default',
    size: 'default',
  },
);

const delegatedProps = reactiveOmit(props, 'class', 'variant', 'size');
</script>

<template>
  <AlertDialogAction
    data-slot="alert-dialog-action"
    v-bind="delegatedProps"
    :class="cn('', buttonVariants({ variant, size }), props.class)"
  >
    <slot />
  </AlertDialogAction>
</template>
