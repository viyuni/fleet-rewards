import type { OrderPageQuery } from '@internal/shared/order';

export const ORDER_QUERY_KEYS = {
  root: ['orders'] as const,
  page: (query: OrderPageQuery = {}) => [...ORDER_QUERY_KEYS.root, 'page', query] as const,
};

export const orderPageQuery = defineQueryOptions((query: OrderPageQuery = {}) => {
  const { $api } = useNuxtApp();
  const requestQuery = {
    ...query,
    keyword: query.keyword ?? '',
  };

  return {
    key: ORDER_QUERY_KEYS.page(query),
    query: () => $api.orders.get({ query: requestQuery }).then(res => res.data),
  };
});
