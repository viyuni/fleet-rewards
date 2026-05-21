import * as v from '.';

/**
 * 调整积分 Body Schema。
 *
 * 用于管理员手动调整账户积分。
 */
export const AdjustBalanceSchema = v.object({
  nonce: v.nonce,
  userId: v.pipe(v.string('请输入用户 ID'), v.description('用户 ID')),
  pointTypeId: v.pipe(v.string('请输入积分类型 ID'), v.description('积分类型 ID')),
  delta: v.pipe(
    v.number('请输入积分变动数量'),
    v.integer('积分变动数量必须是整数'),
    v.description('积分变动数量'),
  ),
  remark: v.optional(v.remark),
});

export type AdjustBalanceBody = v.InferOutput<typeof AdjustBalanceSchema>;

/**
 * 冲正积分流水 Body Schema。
 */
export const ReversalTransactionSchema = v.object({
  transactionId: v.pipe(v.string('请输入积分流水 ID'), v.description('积分流水 ID')),
  remark: v.optional(v.remark),
});

export type ReversalPointTransactionBody = v.InferOutput<typeof ReversalTransactionSchema>;
