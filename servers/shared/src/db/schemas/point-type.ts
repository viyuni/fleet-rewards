import type { InferEnum, InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { index, integer, jsonb, pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core';

import { timestamps } from './column-helpers';

/**
 * 积分类型状态
 */
export const pointTypeStatusEnum = pgEnum('point_type_status', ['active', 'disabled']);

/**
 * 积分类型表
 *
 * Example:
 * - captain_point 舰长积分
 * - admiral_point 提督积分
 * - governor_point 总督积分
 * - activity_point 活动积分
 */
export const pointTypes = pgTable(
  'point_types',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /**
     * 稳定业务编码。
     *
     * Example:
     * captain_point
     * admiral_point
     * governor_point
     * activity_point
     */
    code: text('code').notNull().unique(),

    /**
     * 展示名称。
     *
     * Example:
     * 舰长积分
     */
    name: text('name').notNull().unique(),

    /**
     * 积分说明。
     */
    description: text('description'),

    /**
     * 图标。
     *
     * 可以存 URL，也可以存 icon name。
     */
    icon: text('icon'),

    /**
     * 状态。
     *
     * disabled 后历史数据仍可查询，但不允许继续发放、兑换、转换。
     */
    status: pointTypeStatusEnum('status').notNull().default('active'),

    /**
     * 排序值，越小越靠前。
     */
    sort: integer('sort').notNull().default(0),

    /**
     * 额外配置。
     */
    metadata: jsonb('metadata'),

    ...timestamps,
  },
  t => [index('point_types_status_idx').on(t.status), index('point_types_sort_idx').on(t.sort)],
);

export type PointTypeStatus = InferEnum<typeof pointTypeStatusEnum>;
export type PointType = InferSelectModel<typeof pointTypes>;
export type InsertPointType = InferInsertModel<typeof pointTypes>;
export type UpdatePointType = Partial<InsertPointType>;
