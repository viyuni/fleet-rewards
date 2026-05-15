import { EdenFetchError } from '@elysia/eden';
import type { PiniaColadaOptions } from '@pinia/colada';
import { toast } from 'vue-sonner';

console.log('Loading pinia colada config...');

export default {
  queryOptions: {
    placeholderData(previousData, previousEntry) {
      return previousEntry ? previousData : undefined;
    },
  },
  mutationOptions: {
    onError(error, _vars, context) {
      const { showToast, errorMessage } = context.entry.meta;

      if (!showToast) {
        // somebody threw something that isn't an Error
        console.error('Unexpected error:', error);
        return;
      }

      if (error instanceof EdenFetchError) {
        if (errorMessage) {
          toast.error(errorMessage);
          return;
        }

        if (typeof error.value === 'string') {
          toast.error(error.value);
          return;
        }

        toast.error('请求失败了咕嘎😒');
      } else if (error instanceof Error) {
        toast.error(errorMessage ?? error.message);
      } else {
        toast.error(errorMessage ?? 'Unknown error');
      }
    },

    onSuccess(_data, _variables, context) {
      const { showToast, successMessage } = context.entry.meta;

      if (showToast) {
        toast.success(successMessage ?? '成功了咕嘎👌');
      }
    },
  },
} satisfies PiniaColadaOptions;
