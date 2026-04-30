import { boolean, index, integer, jsonb, pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core';

import { timestamps } from './column-helpers';
import { pointTypes } from './point';

/**
 * 商品状态
 */
export const productStatusEnum = pgEnum('reward_product_status', [
  /**
   * 草稿，后台可见，用户不可兑换
   */
  'draft',

  /**
   * 上架，用户可兑换
   */
  'active',

  /**
   * 下架，用户不可兑换
   */
  'disabled',

  /**
   * 归档，通常不再展示
   */
  'archived',
]);

export const productDeliveryTypeEnum = pgEnum('product_delivery_type', [
  /**
   * 手动发货 / 人工处理
   */
  'manual',

  /**
   * 自动发货
   */
  'automatic',
]);

/**
 * 商品表
 *
 * 一个商品只能使用一种积分兑换。
 */
export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    name: text('name').notNull(),

    description: text('description'),

    /**
     * 商品封面图
     */
    coverUrl: text('cover_url'),

    /**
     * 商品详情
     *
     * 可以存 Markdown / 富文本 JSON 字符串 / HTML。
     */
    detail: text('detail'),

    /**
     * 兑换所需积分类型
     */
    pointTypeId: uuid('point_type_id')
      .notNull()
      .references(() => pointTypes.id),

    /**
     * 兑换所需积分数量
     */
    price: integer('price').notNull(),

    /**
     * 商品状态
     */
    status: productStatusEnum('status').notNull().default('draft'),

    /**
     * 库存
     *
     * null 表示不限库存。
     */
    stock: integer('stock'),

    /**
     * 已兑换数量
     */
    soldCount: integer('sold_count').notNull().default(0),

    /**
     * 每个用户最多兑换次数
     *
     * null 表示不限。
     */
    perUserLimit: integer('per_user_limit'),

    /**
     * 发货方式。
     *
     * automatic：兑换后自动发放，订单可直接 completed
     * manual：兑换后进入 pending，等待管理员处理
     */
    deliveryType: productDeliveryTypeEnum('delivery_type').notNull().default('manual'),

    /**
     * 是否允许用户取消订单。
     *
     * 例如：
     * - 实物商品在未发货前可以取消
     * - 已自动发放的虚拟商品不允许取消
     */
    allowCancel: boolean('allow_cancel').notNull().default(true),

    sort: integer('sort').notNull().default(0),

    metadata: jsonb('metadata'),

    ...timestamps,
  },
  t => [
    index('products_point_type_id_idx').on(t.pointTypeId),
    index('products_status_idx').on(t.status),
    index('products_sort_idx').on(t.sort),
    index('products_deleted_at_idx').on(t.deletedAt),
  ],
);

/**
 * 库存流水状态
 */
export const productStockTransactionTypeEnum = pgEnum('product_stock_transaction_type', [
  /**
   * 用户兑换扣减库存
   */
  'consume',

  /**
   * 取消/退款后恢复库存
   */
  'restore',

  /**
   * 管理员手动调整库存
   */
  'adjust',
]);

export const productStockTransactions = pgTable(
  'product_stock_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),

    type: productStockTransactionTypeEnum('type').notNull(),

    /**
     * 变动数量
     *
     * consume: -1
     * restore: +1
     * adjust: 可正可负
     */
    amount: integer('amount').notNull(),

    /**
     * 变动前库存
     */
    stockBefore: integer('stock_before'),

    /**
     * 变动后库存
     */
    stockAfter: integer('stock_after'),

    /**
     * 来源类型
     *
     * 示例：
     * reward_order
     * admin_adjustment
     */
    sourceType: text('source_type'),

    /**
     * 来源 ID
     *
     * 示例：
     * 订单 ID、管理员操作 ID。
     */
    sourceId: text('source_id'),

    /**
     * 幂等键
     */
    idempotencyKey: text('idempotency_key').unique(),

    remark: text('remark'),

    metadata: jsonb('metadata'),

    ...timestamps,
  },
  t => [
    index('product_stock_transactions_product_id_idx').on(t.productId),
    index('product_stock_transactions_type_idx').on(t.type),
    index('product_stock_transactions_source_idx').on(t.sourceType, t.sourceId),
    index('product_stock_transactions_created_at_idx').on(t.createdAt),
  ],
);
