import { type } from 'arktype';

export const productIdParamsSchema = type({
  id: type('string').describe('商品ID'),
});

const productNameSchema = type('2 <= string <= 100').describe('商品名称');
const productDescriptionSchema = type('string <= 500').describe('商品描述');
const productDetailSchema = type('string').describe('商品详情');
const productCoverUrlSchema = type('string').describe('商品封面图');
const productPointTypeIdSchema = type('string').describe('积分类型ID');
const productPriceSchema = type('number.integer > 0').describe('兑换所需积分数量');
const productStockSchema = type('number.integer >= 0').describe('商品库存');
const productSortSchema = type('number.integer').describe('排序值');
const productAllowCancelSchema = type('boolean').describe('是否允许用户取消订单');
const productMetadataSchema = type('unknown').describe('商品扩展数据');
const productPageSchema = type('number').describe('页码');
const productPageSizeSchema = type('number').describe('每页数量');
const productKeywordSchema = type('string').describe('搜索关键词');

export const productStatusSchema = type("'active' | 'disabled'").describe('商品状态');
export const productDeliveryTypeSchema = type("'manual' | 'automatic'").describe('商品发货方式');

export const productPageQuerySchema = type({
  page: productPageSchema.optional(),
  pageSize: productPageSizeSchema.optional(),
  keyword: productKeywordSchema.optional(),
  status: productStatusSchema.optional(),
  pointTypeId: productPointTypeIdSchema.optional(),
  deliveryType: productDeliveryTypeSchema.optional(),
  t: type('number').describe('时间戳').optional(),
});

export const createProductSchema = type({
  name: productNameSchema,
  description: productDescriptionSchema.optional(),
  coverUrl: productCoverUrlSchema.optional(),
  detail: productDetailSchema.optional(),
  pointTypeId: productPointTypeIdSchema,
  price: productPriceSchema,
  status: productStatusSchema.optional(),
  stock: productStockSchema.optional(),
  deliveryType: productDeliveryTypeSchema.optional(),
  allowCancel: productAllowCancelSchema.optional(),
  sort: productSortSchema.optional(),
  metadata: productMetadataSchema.optional(),
});

export const updateProductSchema = type({
  name: productNameSchema.optional(),
  description: productDescriptionSchema.optional(),
  coverUrl: productCoverUrlSchema.optional(),
  detail: productDetailSchema.optional(),
  pointTypeId: productPointTypeIdSchema.optional(),
  price: productPriceSchema.optional(),
  status: productStatusSchema.optional(),
  stock: productStockSchema.optional(),
  deliveryType: productDeliveryTypeSchema.optional(),
  allowCancel: productAllowCancelSchema.optional(),
  sort: productSortSchema.optional(),
  metadata: productMetadataSchema.optional(),
});

export type ProductPageQuery = typeof productPageQuerySchema.infer;
export type CreateProductInput = typeof createProductSchema.infer;
export type UpdateProductInput = typeof updateProductSchema.infer;
