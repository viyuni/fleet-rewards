import type { InferEnum, InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { index, integer, jsonb, pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core';

import { deletedAt, timestamps } from './column-helpers';
import { pointTypes } from './point-type';

/**
 * 商品状态
 */
export const productStatusEnum = pgEnum('reward_product_status', [
  /**
   * 上架，用户可兑换
   */
  'active',

  /**
   * 下架，用户不可兑换
   */
  'disabled',
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
 * - 一个商品只能使用一种积分兑换。
 * - 仅支持软删除
 */
export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /**
     * 商品名称
     */
    name: text('name').notNull(),

    /**
     * 商品描述
     */
    description: text('description'),

    /**
     * 商品封面图
     */
    cover: text('cover'),

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
    status: productStatusEnum('status').notNull().default('disabled'),

    /**
     * 库存
     */
    stock: integer('stock').notNull().default(0),

    /**
     * 发货方式。
     *
     * automatic：兑换后自动发放，订单可直接 completed
     * manual：兑换后创建已完成订单，等待线下/人工履约
     */
    deliveryType: productDeliveryTypeEnum('delivery_type').notNull().default('manual'),

    /**
     * 排序
     * 值越大越靠前
     */
    sort: integer('sort').notNull().default(0),

    metadata: jsonb('metadata'),

    deletedAt,

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
