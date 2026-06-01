import type { UserConvertPointBody } from '@internal/shared/point-conversion';
import { defineMutation, useMutation } from '@pinia/colada';

export const useConvertPoint = defineMutation(() => {
  const { $api } = useNuxtApp();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '积分转换成功',
    },
    mutation(body: UserConvertPointBody) {
      return $api.pointConversions.convert.post(body);
    },
  });
});
