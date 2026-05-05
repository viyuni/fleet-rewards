import { type } from 'arktype';

const nonZeroInteger = type('number.integer');

export const stockMovementPageQuerySchema = type({
  page: type('number').describe('页码').optional(),
  pageSize: type('number').describe('每页数量').optional(),
  type: type("'consume' | 'restore' | 'adjust'").describe('库存变动类型').optional(),
  startTime: type('number').describe('开始时间').optional(),
  endTime: type('number').describe('结束时间').optional(),
  productId: type('string').describe('商品 ID'),
});

export const stockAdjustmentSchema = type({
  delta: nonZeroInteger.describe('库存调整数量'),
  remark: type('string').optional(),
  requestId: type('string').describe('请求 ID'),
});

export type StockMovementPageQuery = typeof stockMovementPageQuerySchema.infer;
export type StockAdjustmentInput = typeof stockAdjustmentSchema.infer;
