import * as v from 'valibot';

import {
  BooleanInputSchema,
  emptyable,
  KeywordQuerySchema,
  NumberInputSchema,
  PageQuerySchema,
} from './common';
/**
 * 商品 ID Params Schema。
 */
export const ProductIdParamsSchema = v.object({
  productId: v.pipe(v.string('请输入商品 ID'), v.description('商品 ID')),
});

export type ProductIdParams = v.InferOutput<typeof ProductIdParamsSchema>;

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
export const ProductStatusSchema = v.pipe(
  v.enum(ProductStatus, '请选择有效的商品状态'),
  v.description('商品状态'),
);

export type ProductStatus = v.InferOutput<typeof ProductStatusSchema>;

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
export const ProductDeliveryTypeSchema = v.pipe(
  v.enum(ProductDeliveryType, '请选择有效的商品发货方式'),
  v.description('商品发货方式'),
);

export type ProductDeliveryType = v.InferOutput<typeof ProductDeliveryTypeSchema>;

/**
 * 商品名称 Schema。
 */
const ProductNameSchema = v.pipe(
  v.string('请输入商品名称'),
  v.minLength(2, '商品名称不能少于 2 个字符'),
  v.maxLength(100, '商品名称不能超过 100 个字符'),
  v.description('商品名称'),
);

/**
 * 商品描述 Schema。
 */
const ProductDescriptionSchema = v.pipe(
  v.string('请输入商品描述'),
  v.maxLength(500, '商品描述不能超过 500 个字符'),
  v.description('商品描述'),
);

/**
 * 商品详情 Schema。
 */
const ProductDetailSchema = v.pipe(v.string('请输入商品详情'), v.description('商品详情'));

/**
 * 商品封面图 Schema。
 */
const ProductCoverSchema = v.pipe(
  v.file('请选择商品封面图'),
  v.mimeType(['image/jpeg', 'image/png', 'image/webp'], '商品封面图仅支持 JPG、PNG、WebP 格式'),
  v.maxSize(1024 * 1024 * 20, '请选择一个小于 20MB 的文件'),
  v.description('商品封面图'),
);

/**
 * 商品关联积分类型 ID Schema。
 */
const ProductPointTypeIdSchema = v.pipe(
  v.string('请输入积分类型 ID'),
  v.description('积分类型 ID'),
);

/**
 * 商品兑换价格 Schema。
 */
const ProductPriceSchema = v.pipe(
  NumberInputSchema('请输入兑换所需积分数量'),
  v.integer('兑换所需积分数量必须是整数'),
  v.minValue(1, '兑换所需积分数量必须大于 0'),
  v.description('兑换所需积分数量'),
);

/**
 * 商品库存 Schema。
 */
const ProductStockSchema = v.pipe(
  NumberInputSchema('请输入商品库存'),
  v.integer('商品库存必须是整数'),
  v.minValue(0, '商品库存不能小于 0'),
  v.description('商品库存'),
);

/**
 * 商品排序值 Schema。
 */
const ProductSortSchema = v.pipe(
  NumberInputSchema('请输入排序值'),
  v.integer('排序值必须是整数'),
  v.description('排序值'),
);

/**
 * 商品是否允许用户取消订单 Schema。
 */
const ProductAllowCancelSchema = v.pipe(
  BooleanInputSchema('请选择是否允许用户取消订单'),
  v.description('是否允许用户取消订单'),
);

/**
 * 商品可兑换时间 Schema。
 */
const ProductTimeSchema = v.pipe(
  NumberInputSchema('请输入可兑换时间戳'),
  v.integer('可兑换时间戳必须是整数'),
  v.description('可兑换时间戳'),
);

/**
 * 商品扩展数据 Schema。
 */
const ProductMetadataSchema = v.pipe(
  v.string('请输入商品扩展数据'),
  v.parseJson(undefined, '商品扩展数据必须是合法 JSON 字符串'),
  v.description('商品扩展数据'),
);

/**
 * 商品列表分页查询 Query Schema。
 */
export const ProductPageQuerySchema = v.intersect([
  PageQuerySchema,
  KeywordQuerySchema,
  v.object({
    status: v.optional(ProductStatusSchema),
    pointTypeId: v.optional(ProductPointTypeIdSchema),
    deliveryType: v.optional(ProductDeliveryTypeSchema),
  }),
]);

export type ProductPageQuery = v.InferOutput<typeof ProductPageQuerySchema>;

/**
 * 创建商品 Body Schema。
 */
export const CreateProductSchema = v.object({
  name: ProductNameSchema,

  description: v.optional(emptyable(ProductDescriptionSchema)),
  cover: v.optional(ProductCoverSchema),
  detail: v.optional(emptyable(ProductDetailSchema)),

  pointTypeId: ProductPointTypeIdSchema,
  price: ProductPriceSchema,

  status: v.optional(ProductStatusSchema),
  stock: v.optional(ProductStockSchema),
  deliveryType: v.optional(ProductDeliveryTypeSchema),
  startTime: v.optional(ProductTimeSchema),
  endTime: v.optional(ProductTimeSchema),
  allowCancel: v.optional(ProductAllowCancelSchema),
  sort: v.optional(ProductSortSchema),
  metadata: v.optional(emptyable(ProductMetadataSchema)),
});

export type CreateProductBody = v.InferOutput<typeof CreateProductSchema>;

/**
 * 更新商品 Body Schema。
 */
export const UpdateProductSchema = v.object({
  name: v.optional(ProductNameSchema),

  description: v.nullish(emptyable(ProductDescriptionSchema)),
  cover: v.optional(ProductCoverSchema),
  detail: v.nullish(emptyable(ProductDetailSchema)),

  pointTypeId: v.optional(ProductPointTypeIdSchema),
  price: v.optional(ProductPriceSchema),

  status: v.optional(ProductStatusSchema),
  stock: v.optional(ProductStockSchema),
  deliveryType: v.optional(ProductDeliveryTypeSchema),
  startTime: v.nullish(ProductTimeSchema),
  endTime: v.nullish(ProductTimeSchema),
  allowCancel: v.optional(ProductAllowCancelSchema),
  sort: v.optional(ProductSortSchema),
  metadata: v.nullish(emptyable(ProductMetadataSchema)),
});

export type UpdateProductBody = v.InferOutput<typeof UpdateProductSchema>;
