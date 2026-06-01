import type { CreateOrderBody } from '@internal/shared/order';
import { defineMutation, useMutation } from '@pinia/colada';

export const useCreateOrder = defineMutation(() => {
  const { $api } = useNuxtApp();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '购买成功',
    },
    mutation(body: CreateOrderBody) {
      return $api.orders.post(body);
    },
  });
});
