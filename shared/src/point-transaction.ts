import { type } from 'arktype';

import { dateRangeQuerySchema, pageQuerySchema } from './common';

/**
 * 积分流水 ID Params Schema。
 */
export const pointTransactionIdParamsSchema = type({
  id: type('string').describe('积分流水 ID'),
});

export type PointTransactionIdParams = typeof pointTransactionIdParamsSchema.infer;

/**
 * 积分流水类型。
 */
export const PointTransactionType = {
  Grant: 'grant',
  Consume: 'consume',
  Refund: 'refund',
  Adjust: 'adjust',
  Reversal: 'reversal',
} as const;

/**
 * 积分流水类型 Schema。
 */
export const pointTransactionTypeSchema = type
  .valueOf(PointTransactionType)
  .describe('积分流水类型');

export type PointTransactionType = typeof pointTransactionTypeSchema.infer;

/**
 * 积分流水分页查询 Query Schema。
 */
export const transactionPageQuerySchema = pageQuerySchema.and(dateRangeQuerySchema).and({
  'type?': pointTransactionTypeSchema,
  'pointTypeId?': type('string').describe('积分类型 ID'),
  'userId?': type('string').describe('用户 ID'),
});

export type PointTransactionPageQuery = typeof transactionPageQuerySchema.infer;
