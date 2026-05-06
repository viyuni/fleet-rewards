import { type } from 'arktype';

import { dateRangeQuerySchema, nonceBodySchema, pageQuerySchema, remarkBodySchema } from './common';

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
 * 调整积分 Body Schema。
 *
 * 用于管理员手动调整账户积分。
 */
export const adjustBalanceSchema = nonceBodySchema.and(remarkBodySchema).and({
  accountId: type('string').describe('账户 ID'),
  delta: type('number.integer').describe('积分变动数量'),
});

export type AdjustBalanceBody = typeof adjustBalanceSchema.infer;

/**
 * 冲正积分流水 Body Schema。
 */
export const reversalTransactionSchema = remarkBodySchema.and({
  transactionId: type('string').describe('积分流水 ID'),
});

export type ReversalPointTransactionBody = typeof reversalTransactionSchema.infer;

/**
 * 积分流水分页查询 Query Schema。
 */
export const transactionPageQuerySchema = pageQuerySchema.and(dateRangeQuerySchema).and({
  'type?': pointTransactionTypeSchema,
  'pointTypeId?': type('string').describe('积分类型 ID'),
  'userId?': type('string').describe('用户 ID'),
});

export type PointTransactionPageQuery = typeof transactionPageQuerySchema.infer;
