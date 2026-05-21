import type { CreateProductBody, UpdateProductBody } from '@internal/shared/product';
import type { StockAdjustmentBody } from '@internal/shared/stock';
import { defineMutation, useMutation, useQueryCache } from '@pinia/colada';

import { PRODUCT_QUERY_KEYS } from './queries';

function useInvalidateProducts() {
  const queryCache = useQueryCache();

  return () => queryCache.invalidateQueries({ key: PRODUCT_QUERY_KEYS.root });
}

export const useAdjustProductStock = defineMutation(() => {
  const { $api } = useNuxtApp();
  const invalidateProducts = useInvalidateProducts();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '库存已调整',
    },
    mutation(input: { productId: string; body: StockAdjustmentBody }) {
      return $api.products({ productId: input.productId }).stock.adjust.patch(input.body);
    },
    onSettled: invalidateProducts,
  });
});

export const useCreateProduct = defineMutation(() => {
  const { $api } = useNuxtApp();
  const invalidateProducts = useInvalidateProducts();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '商品已创建',
    },
    mutation(body: CreateProductBody) {
      return $api.products.post(body);
    },
    onSettled: invalidateProducts,
  });
});

export const useUpdateProduct = defineMutation(() => {
  const { $api } = useNuxtApp();
  const invalidateProducts = useInvalidateProducts();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '商品已更新',
    },
    mutation(input: { productId: string; body: UpdateProductBody }) {
      return $api.products({ productId: input.productId }).put(input.body);
    },
    onSettled: invalidateProducts,
  });
});

export const useEnableProduct = defineMutation(() => {
  const { $api } = useNuxtApp();
  const invalidateProducts = useInvalidateProducts();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '商品已上架',
    },
    mutation(productId: string) {
      return $api.products({ productId }).enable.patch();
    },
    onSettled: invalidateProducts,
  });
});

export const useDisableProduct = defineMutation(() => {
  const { $api } = useNuxtApp();
  const invalidateProducts = useInvalidateProducts();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '商品已下架',
    },
    mutation(productId: string) {
      return $api.products({ productId }).disable.patch();
    },
    onSettled: invalidateProducts,
  });
});
