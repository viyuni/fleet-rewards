import { type } from 'arktype';

import { nonceBodySchema, remarkBodySchema } from './common';

/**
 * 调整积分 Body Schema。
 *
 * 用于管理员手动调整账户积分。
 */
export const adjustBalanceSchema = nonceBodySchema.and(remarkBodySchema).and({
  userId: type('string').describe('用户 ID'),
  pointTypeId: type('string').describe('积分类型 ID'),
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
