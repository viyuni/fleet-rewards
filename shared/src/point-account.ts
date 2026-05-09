import * as v from 'valibot';

import { NonceBodySchema, RemarkBodySchema } from './common';

/**
 * 调整积分 Body Schema。
 *
 * 用于管理员手动调整账户积分。
 */
export const AdjustBalanceSchema = v.intersect([
  NonceBodySchema,
  RemarkBodySchema,
  v.object({
    userId: v.pipe(v.string('请输入用户 ID'), v.description('用户 ID')),
    pointTypeId: v.pipe(v.string('请输入积分类型 ID'), v.description('积分类型 ID')),
    delta: v.pipe(
      v.number('请输入积分变动数量'),
      v.integer('积分变动数量必须是整数'),
      v.description('积分变动数量'),
    ),
  }),
]);

export type AdjustBalanceBody = v.InferOutput<typeof AdjustBalanceSchema>;

/**
 * 冲正积分流水 Body Schema。
 */
export const ReversalTransactionSchema = v.intersect([
  RemarkBodySchema,
  v.object({
    transactionId: v.pipe(v.string('请输入积分流水 ID'), v.description('积分流水 ID')),
  }),
]);

export type ReversalPointTransactionBody = v.InferOutput<typeof ReversalTransactionSchema>;
