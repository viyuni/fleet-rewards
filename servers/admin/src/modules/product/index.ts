import {
  createProductSchema,
  productIdParamsSchema,
  productPageQuerySchema,
  stockAdjustmentSchema,
  stockMovementPageQuerySchema,
  updateProductSchema,
} from '@internal/shared/schema';
import { productModule } from '@server/shared/product';
import Elysia from 'elysia';

import { db } from '#server/admin/db';

import { authGuard } from '../auth';
import { AdminProductUseCase } from './usecase';
import { AdminStockMovementUseCase } from './usecase/admin-stock-movement.usecase';

export const product = new Elysia({
  name: 'ProductRoute',
  prefix: '/products',
  detail: {
    tags: ['Product'],
  },
})
  .use(authGuard)
  .use(productModule({ db }))
  .decorate('adminProduct', new AdminProductUseCase(db))
  .decorate('adminStockMovement', new AdminStockMovementUseCase(db))
  .get(
    '/',
    ({ query, adminProduct }) => {
      return adminProduct.page(query);
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
    ({ query, adminStockMovement }) => {
      return adminStockMovement.page(query);
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
    ({ query, params, adminStockMovement }) => {
      return adminStockMovement.page({
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
    ({ params, product }) => {
      return product.get(params.id);
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
    ({ body, product }) => {
      return product.create(body);
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
    ({ body, params, product }) => {
      return product.update(params.id, body);
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
    ({ params, product }) => {
      return product.active(params.id);
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
    ({ params, product }) => {
      return product.disable(params.id);
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
    async ({ body, params, product, userId }) => {
      const {
        product: { id, stock },
      } = await product.adminAdjustStock(params.id, userId, body);

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
