import type { InferEnum, InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { boolean, index, integer, jsonb, pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core';

import { timestamps } from './column-helpers';
import { pointTypes } from './point-type';

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

/**
 * 商品发货方式
 */
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

export type ProductStatus = InferEnum<typeof productStatusEnum>;
export type ProductDeliveryType = InferEnum<typeof productDeliveryTypeEnum>;
export type Product = InferSelectModel<typeof products>;
export type InsertProduct = InferInsertModel<typeof products>;
export type UpdateProduct = Partial<InsertProduct>;
