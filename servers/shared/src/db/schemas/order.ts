import type { InferEnum, InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { timestamps } from './column-helpers';
import { pointTypes } from './point-type';
import { productDeliveryTypeEnum, products } from './product';

/**
 * 订单状态枚举
 * 状态流转：
 * 1. pending -> 管理员处理 -> completed
 * 2. pending -> 用户取消 -> cancelRequested -> refunded
 */
export const orderStatusEnum = pgEnum('order_status', [
  /**
   * 待处理
   *
   * 用户已兑换，积分已扣除。
   * 等待管理员处理。
   */
  'pending',

  /**
   * 已完成
   *
   * 管理员处理完成，或者自动完成商品直接完成。
   */
  'completed',

  /**
   * 取消申请中
   *
   * 用户申请取消，但积分还没有返还。
   * 等待管理员审核/处理。
   */
  'cancelRequested',

  /**
   * 已退款
   *
   * 管理员同意取消/退款后，积分已返还。
   */
  'refunded',
]);

/**
 * 兑换订单表
 *
 * 一个订单兑换一个商品，只使用一种积分。
 */
export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /**
     * 订单号
     */
    orderNo: text('order_no').notNull(),

    /**
     * 用户 ID
     */
    userId: uuid('user_id').notNull(),

    /**
     * 商品 ID
     */
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),

    /**
     * 商品名称快照
     */
    productNameSnapshot: text('product_name_snapshot').notNull(),

    /**
     * 商品封面快照
     */
    productCoverUrlSnapshot: text('product_cover_url_snapshot'),

    /**
     * 积分类型 ID
     */
    pointTypeId: uuid('point_type_id')
      .notNull()
      .references(() => pointTypes.id),

    /**
     * 积分类型名称快照
     */
    pointTypeNameSnapshot: text('point_type_name_snapshot').notNull(),

    /**
     * 实际扣除积分数量
     */
    price: integer('price').notNull(),

    /**
     * 商品处理方式快照
     */
    deliveryTypeSnapshot: productDeliveryTypeEnum('delivery_type_snapshot').notNull(),

    /**
     * 下单时是否允许取消的快照
     */
    allowCancelSnapshot: boolean('allow_cancel_snapshot').notNull(),

    /**
     * 下单时是否允许退款的快照
     */
    allowRefundSnapshot: boolean('allow_refund_snapshot').notNull(),

    /**
     * 扣积分流水 ID
     */
    consumeTransactionId: uuid('consume_transaction_id'),

    /**
     * 返还积分流水 ID
     */
    refundTransactionId: uuid('refund_transaction_id'),

    /**
     * 订单状态
     */
    status: orderStatusEnum('status').notNull().default('pending'),

    /**
     * 联系 / 收货信息
     *
     * 实物可以存收货信息。
     * 虚拟商品可以为空。
     */
    contactInfo: jsonb('contact_info'),

    /**
     * 用户备注
     */
    userRemark: text('user_remark'),

    /**
     * 管理员备注
     */
    adminRemark: text('admin_remark'),

    /**
     * 取消原因
     */
    cancelReason: text('cancel_reason'),

    /**
     * 退款原因
     */
    refundReason: text('refund_reason'),

    /**
     * 发放 / 处理结果
     *
     * 不接外部平台时，这里只记录内部处理信息即可。
     *
     * 示例：
     * {
     *   "operatorId": "...",
     *   "message": "已发货",
     *   "trackingNo": "..."
     * }
     */
    fulfillmentResult: jsonb('fulfillment_result'),

    /**
     * 完成时间
     */
    completedAt: timestamp('completed_at', { withTimezone: true }),

    /**
     * 取消 / 退款时间
     */
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),

    /**
     * 退款时间
     */
    refundedAt: timestamp('refunded_at', { withTimezone: true }),

    metadata: jsonb('metadata'),

    ...timestamps,
  },
  t => [
    uniqueIndex('reward_orders_order_no_unique').on(t.orderNo),
    index('reward_orders_user_id_idx').on(t.userId),
    index('reward_orders_product_id_idx').on(t.productId),
    index('reward_orders_point_type_id_idx').on(t.pointTypeId),
    index('reward_orders_status_idx').on(t.status),
    index('reward_orders_deleted_at_idx').on(t.deletedAt),
    index('reward_orders_created_at_idx').on(t.createdAt),
  ],
);

export type OrderStatus = InferEnum<typeof orderStatusEnum>;
export type Order = InferSelectModel<typeof orders>;
export type InsertOrder = InferInsertModel<typeof orders>;
export type UpdateOrder = Partial<InsertOrder>;
