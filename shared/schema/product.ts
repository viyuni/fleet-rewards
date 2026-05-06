import { type } from 'arktype';

import { keywordQuerySchema, pageQuerySchema } from './common';

/**
 * 商品 ID Params Schema。
 */
export const productIdParamsSchema = type({
  id: type('string').describe('商品 ID'),
});

export type ProductIdParams = typeof productIdParamsSchema.infer;

/**
 * 商品状态。
 */
export const ProductStatus = {
  Active: 'active',
  Disabled: 'disabled',
} as const;

/**
 * 商品状态 Schema。
 */
export const productStatusSchema = type.valueOf(ProductStatus).describe('商品状态');

export type ProductStatus = typeof productStatusSchema.infer;

/**
 * 商品发货方式。
 */
export const ProductDeliveryType = {
  Manual: 'manual',
  Automatic: 'automatic',
} as const;

/**
 * 商品发货方式 Schema。
 */
export const productDeliveryTypeSchema = type.valueOf(ProductDeliveryType).describe('商品发货方式');

export type ProductDeliveryType = typeof productDeliveryTypeSchema.infer;

/**
 * 商品名称 Schema。
 */
const productNameSchema = type('2 <= string <= 100').describe('商品名称');

/**
 * 商品描述 Schema。
 */
const productDescriptionSchema = type('string <= 500').describe('商品描述');

/**
 * 商品详情 Schema。
 */
const productDetailSchema = type('string').describe('商品详情');

/**
 * 商品封面图 Schema。
 */
const productCoverSchema = type('string').describe('商品封面图');

/**
 * 商品关联积分类型 ID Schema。
 */
const productPointTypeIdSchema = type('string').describe('积分类型 ID');

/**
 * 商品兑换价格 Schema。
 */
const productPriceSchema = type('number.integer > 0').describe('兑换所需积分数量');

/**
 * 商品库存 Schema。
 */
const productStockSchema = type('number.integer >= 0').describe('商品库存');

/**
 * 商品排序值 Schema。
 */
const productSortSchema = type('number.integer').describe('排序值');

/**
 * 商品是否允许用户取消订单 Schema。
 */
const productAllowCancelSchema = type('boolean').describe('是否允许用户取消订单');

/**
 * 商品扩展数据 Schema。
 */
const productMetadataSchema = type('unknown').describe('商品扩展数据');

/**
 * 商品列表分页查询 Query Schema。
 */
export const productPageQuerySchema = pageQuerySchema.and(keywordQuerySchema).and({
  'status?': productStatusSchema,
  'pointTypeId?': productPointTypeIdSchema,
  'deliveryType?': productDeliveryTypeSchema,
});

export type ProductPageQuery = typeof productPageQuerySchema.infer;

/**
 * 创建商品 Body Schema。
 */
export const createProductSchema = type({
  name: productNameSchema,

  'description?': productDescriptionSchema,
  'cover?': productCoverSchema,
  'detail?': productDetailSchema,

  pointTypeId: productPointTypeIdSchema,
  price: productPriceSchema,

  'status?': productStatusSchema,
  'stock?': productStockSchema,
  'deliveryType?': productDeliveryTypeSchema,
  'allowCancel?': productAllowCancelSchema,
  'sort?': productSortSchema,
  'metadata?': productMetadataSchema,
});

export type CreateProductBody = typeof createProductSchema.infer;

/**
 * 更新商品 Body Schema。
 */
export const updateProductSchema = type({
  'name?': productNameSchema,

  'description?': productDescriptionSchema,
  'cover?': productCoverSchema,
  'detail?': productDetailSchema,

  'pointTypeId?': productPointTypeIdSchema,
  'price?': productPriceSchema,

  'status?': productStatusSchema,
  'stock?': productStockSchema,
  'deliveryType?': productDeliveryTypeSchema,
  'allowCancel?': productAllowCancelSchema,
  'sort?': productSortSchema,
  'metadata?': productMetadataSchema,
});

export type UpdateProductBody = typeof updateProductSchema.infer;
