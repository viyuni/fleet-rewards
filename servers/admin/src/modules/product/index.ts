import {
  createProductSchema,
  productIdParamsSchema,
  productPageQuerySchema,
  stockAdjustmentSchema,
  stockMovementPageQuerySchema,
  updateProductSchema,
} from '@internal/shared/schema';
import Elysia from 'elysia';

import { appContext } from '../../context';

export const product = new Elysia({
  name: 'ProductRoute',
  prefix: '/products',
  detail: {
    tags: ['Product'],
  },
})
  .use(appContext)

  .get(
    '/',
    ({ query, productUseCase }) => {
      return productUseCase.page(query);
    },
    {
      query: productPageQuerySchema,
      requiredAuth: true,
      detail: {
        description: '商品列表',
      },
    },
  )
  .get(
    '/stock/movements',
    ({ query, adminStockMovementUseCase }) => {
      return adminStockMovementUseCase.page(query);
    },
    {
      query: stockMovementPageQuerySchema,
      requiredAuth: true,
      detail: {
        description: '商品库存流水',
      },
    },
  )
  .get(
    '/:id/stock/movements',
    ({ query, params, adminStockMovementUseCase }) => {
      return adminStockMovementUseCase.page({
        ...query,
        productId: params.id,
      });
    },
    {
      query: stockMovementPageQuerySchema,
      params: productIdParamsSchema,
      requiredAuth: true,
      detail: {
        description: '商品库存流水',
      },
    },
  )
  .get(
    '/:id',
    ({ params, productUseCase }) => {
      return productUseCase.get(params.id);
    },
    {
      params: productIdParamsSchema,
      requiredAuth: true,
      detail: {
        description: '商品详情',
      },
    },
  )
  .post(
    '/',
    ({ body, productUseCase }) => {
      return productUseCase.create(body);
    },
    {
      body: createProductSchema,
      requiredAuth: true,
      detail: {
        description: '创建商品',
      },
    },
  )
  .put(
    '/:id',
    ({ body, params, productUseCase }) => {
      return productUseCase.update(params.id, body);
    },
    {
      body: updateProductSchema,
      params: productIdParamsSchema,
      requiredAuth: true,
      detail: {
        description: '更新商品',
      },
    },
  )
  .patch(
    '/:id/enable',
    ({ params, productUseCase }) => {
      return productUseCase.active(params.id);
    },
    {
      params: productIdParamsSchema,
      requiredAuth: true,
      detail: {
        description: '上架商品',
      },
    },
  )
  .patch(
    '/:id/disable',
    ({ params, productUseCase }) => {
      return productUseCase.disable(params.id);
    },
    {
      params: productIdParamsSchema,
      requiredAuth: true,
      detail: {
        description: '下架商品',
      },
    },
  )
  .patch(
    '/:id/stock/adjust',
    async ({ body, params, productUseCase, userId }) => {
      const {
        product: { id, stock },
      } = await productUseCase.adminAdjustStock(params.id, userId, body);

      return {
        id,
        stock,
      };
    },
    {
      body: stockAdjustmentSchema,
      params: productIdParamsSchema,
      requiredAuth: true,
      detail: {
        description: '调整商品库存',
      },
    },
  );
