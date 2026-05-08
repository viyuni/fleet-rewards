import { type } from 'arktype';

import { dateRangeQuerySchema, nonceBodySchema, pageQuerySchema, remarkSchema } from './common';

/**
 * 库存变动类型。
 */
export const StockMovementType = {
  Consume: 'consume',
  Restore: 'restore',
  Adjust: 'adjust',
} as const;

/**
 * 库存变动类型 Schema。
 */
export const stockMovementTypeSchema = type.valueOf(StockMovementType).describe('库存变动类型');

export type StockMovementType = typeof stockMovementTypeSchema.infer;

/**
 * 非零整数 Schema。
 *
 * 用于表示库存调整增量：
 * - 大于 0：增加库存
 * - 小于 0：减少库存
 * - 不允许为 0
 */
const nonZeroIntegerSchema = type('number.integer < 0 | number.integer > 0');

/**
 * 库存流水分页查询 Query Schema。
 *
 * 用于按商品、库存变动类型、时间范围分页查询库存流水。
 */
export const stockMovementPageQuerySchema = pageQuerySchema.and(dateRangeQuerySchema).and({
  'type?': stockMovementTypeSchema,
  'productId?': type('string').describe('商品 ID'),
});

export type StockMovementPageQuery = typeof stockMovementPageQuerySchema.infer;

/**
 * 库存调整 Body Schema。
 *
 * 用于管理员手动调整商品库存。
 */
export const stockAdjustmentSchema = nonceBodySchema.and({
  delta: nonZeroIntegerSchema.describe('库存调整数量'),
  'remark?': remarkSchema,
});

export type StockAdjustmentBody = typeof stockAdjustmentSchema.infer;
