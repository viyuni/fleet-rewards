import type { ReversalPointTransactionBody } from '@internal/shared/point-account';
import { defineMutation, useMutation, useQueryCache } from '@pinia/colada';

import { POINT_QUERY_KEYS } from './queries';

function useInvalidatePoints() {
  const queryCache = useQueryCache();

  return () => queryCache.invalidateQueries({ key: POINT_QUERY_KEYS.root });
}

export const useReversePointTransaction = defineMutation(() => {
  const { $api } = useNuxtApp();
  const invalidatePoints = useInvalidatePoints();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '积分流水已冲正',
    },
    mutation(body: ReversalPointTransactionBody) {
      return $api.points.transactions.reversal.patch(body);
    },
    onSettled: invalidatePoints,
  });
});
