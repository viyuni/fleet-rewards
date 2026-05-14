import type { OrderPageQuery } from '@internal/shared/order';

export const ORDER_QUERY_KEYS = {
  root: ['orders'] as const,
  page: (query: OrderPageQuery = {}) => [...ORDER_QUERY_KEYS.root, 'page', query] as const,
};

export const orderPageQuery = defineQueryOptions((query: OrderPageQuery = {}) => ({
  key: ORDER_QUERY_KEYS.page(query),
  query: () => {
    const { $api } = useNuxtApp();

    return $api.orders.get({ query }).then(res => res.data);
  },
}));
