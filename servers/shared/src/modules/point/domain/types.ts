import type { PointTransactionType } from '@server/db/schemas';
export type PointMetadata = Record<string, unknown>;

/**
 * 积分流水类型
 */
export const POINT_SOURCE_TYPE = {
  /**
   * 订单消费
   */
  OrderConsume: 'order_consume',

  /**
   * 订单退款
   */
  OrderRefund: 'order_refund',

  /**
   * 管理员调整
   */
  AdminAdjustment: 'admin_adjustment',

  /**
   * 冲正流水
   */
  Reversal: 'reversal',

  /**
   * 大航海事件
   */
  GuardEvent: 'guard_event',
} as const;

export interface ChangeBalanceBase<TType extends PointTransactionType> {
  /**
   * 积分流水类型
   */
  type: TType;

  /**
   * 用户ID
   */
  userId: string;

  /**
   * 积分类型ID
   * @example
   */
  pointTypeId: string;
  /**
   * 增加或减少的积分数量
   * @example -1
   * @example 1
   */
  delta: number;

  /**
   * 积分流水来源类型
   * 可以使用内建的一些值 `POINT_SOURCE_TYPE`
   * @example 'order_consume'
   */
  sourceType: string;

  /**
   * 积分流水来源ID
   * @example 'order:999'
   */
  sourceId: string;

  /**
   * 幂等键
   * @example 'guard_event:999:1:1777566676439'
   */
  idempotencyKey: string;

  /**
   * 积分流水备注
   */
  remark?: string;

  /**
   * 积分流水扩展信息
   */
  metadata?: PointMetadata;
}

/**
 * 发放
 */
export interface GrantChangeInput extends ChangeBalanceBase<'grant'> {}

/**
 * 消费
 */
export interface ConsumeChangeInput extends ChangeBalanceBase<'consume'> {}

/**
 * 退款
 */
export interface RefundChangeInput extends ChangeBalanceBase<'refund'> {}

/**
 * 管理员调整
 */
export interface AdjustChangeInput extends ChangeBalanceBase<'adjust'> {
  sourceType: 'admin_adjustment';
  metadata: PointMetadata & {
    adminUserId: string;
  };
}

/**
 * 冲正流水
 */
export interface ReversalChangeInput extends ChangeBalanceBase<'reversal'> {
  sourceType: 'reversal';
  reversalOfTransactionId: string;
}

export type ChangeBalanceInput =
  | GrantChangeInput
  | ConsumeChangeInput
  | RefundChangeInput
  | AdjustChangeInput
  | ReversalChangeInput;
