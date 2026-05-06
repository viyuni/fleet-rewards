import { type } from 'arktype';

import {
  dateRangeQuerySchema,
  keywordQuerySchema,
  nonceBodySchema,
  pageQuerySchema,
} from './common';

/**
 * 订单 ID Params Schema
 */
export const orderIdParamsSchema = type({
  id: type('string').describe('订单ID'),
});

/**
 * 订单状态
 */
export const OrderStatus = {
  Pending: 'pending',
  Completed: 'completed',
  Refunded: 'refunded',
} as const;

/**
 * 订单状态 Schema
 */
export const orderStatusSchema = type.valueOf(OrderStatus).describe('订单状态');

/**
 * 订单查询参数 Schema
 */
export const orderPageQuerySchema = pageQuerySchema
  .and(keywordQuerySchema)
  .and(dateRangeQuerySchema)
  .and({
    'status?': orderStatusSchema,
    'userId?': type('string').describe('用户ID'),
  });

export type OrderPageQuery = typeof orderPageQuerySchema.infer;

/**
 * 创建订单 Schema
 */
export const createOrderSchema = nonceBodySchema.and({
  productId: type('string').describe('用户ID'),
  'remark?': type('string <= 500').describe('备注'),
});

export type CreateOrderBody = typeof createOrderSchema.infer;

/**
 * 退款订单 Schema
 */
export const refundOrderSchema = type({
  'reason?': type('string <= 100').describe('备注'),
});

export type RefundOrderBody = typeof refundOrderSchema.infer;
