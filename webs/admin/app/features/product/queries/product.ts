import type { ProductPageQuery } from '@internal/shared/product';
import type { StockMovementPageQuery } from '@internal/shared/stock';

export const PRODUCT_QUERY_KEYS = {
  root: ['products'] as const,
  page: (query: ProductPageQuery = {}) => [...PRODUCT_QUERY_KEYS.root, 'page', query] as const,
  stockMovements: (query: StockMovementPageQuery = {}) =>
    [...PRODUCT_QUERY_KEYS.root, 'stockMovements', query] as const,
};

export const productPageQuery = defineQueryOptions((query: ProductPageQuery = {}) => ({
  key: PRODUCT_QUERY_KEYS.page(query),
  query: () => {
    const api = useAdminApi();

    return api.products.get({ query }).then(res => res.data);
  },
}));

export const stockMovementPageQuery = defineQueryOptions((query: StockMovementPageQuery = {}) => ({
  key: PRODUCT_QUERY_KEYS.stockMovements(query),
  query: () => {
    const api = useAdminApi();

    return api.products.stock.movements.get({ query }).then(res => res.data);
  },
}));
