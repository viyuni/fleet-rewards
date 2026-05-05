import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { timestamps } from './column-helpers';
import { pointTypes } from './point-type';

/**
 * 积分转换规则表
 * - 不允许删除
 *
 * 示例：
 * 1 总督积分 -> 10 舰长积分
 */
export const pointConversionRules = pgTable(
  'point_conversion_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /**
     * 显示名称。
     *
     * 示例：
     * 督级积分兑换舰级积分
     */
    name: text('name').notNull().unique('point_conversion_rules_name_unique'),

    /**
     * 描述。
     */
    description: text('description'),

    /**
     * 备注。
     */
    remark: text('remark'),

    /**
     * 来源积分类型。
     */
    fromPointTypeId: uuid('from_point_type_id')
      .notNull()
      .references(() => pointTypes.id),

    /**
     * 目标积分类型。
     */
    toPointTypeId: uuid('to_point_type_id')
      .notNull()
      .references(() => pointTypes.id),

    /**
     * 来源积分数量。
     *
     * 例如：
     * 1 总督积分 -> 10 舰长积分
     * fromAmount = 1
     */
    fromAmount: integer('from_amount').notNull(),

    /**
     * 目标积分数量。
     *
     * 例如：
     * 1 总督积分 -> 10 舰长积分
     * toAmount = 10
     */
    toAmount: integer('to_amount').notNull(),

    /**
     * 单次最小转换来源积分数量。
     *
     * null 表示不限制。
     */
    minFromAmount: integer('min_from_amount'),

    /**
     * 单次最大转换来源积分数量。
     *
     * null 表示不限制。
     */
    maxFromAmount: integer('max_from_amount'),

    /**
     * 是否启用。
     */
    enabled: boolean('enabled').notNull().default(true),

    /**
     * 生效时间范围, null 表示永久有效。
     */
    startsAt: timestamp('starts_at', { withTimezone: true }),

    /**
     * 失效时间范围, null 表示永久有效。
     */
    endsAt: timestamp('ends_at', { withTimezone: true }),

    metadata: jsonb('metadata'),

    ...timestamps,
  },
  t => [
    uniqueIndex('point_conversion_rules_from_to_unique_idx').on(t.fromPointTypeId, t.toPointTypeId),
    index('point_conversion_rules_from_point_type_id_idx').on(t.fromPointTypeId),
    index('point_conversion_rules_to_point_type_id_idx').on(t.toPointTypeId),
    index('point_conversion_rules_enabled_idx').on(t.enabled),
    index('point_conversion_rules_time_range_idx').on(t.startsAt, t.endsAt),
  ],
);

export type PointConversionRule = InferSelectModel<typeof pointConversionRules>;
export type InsertPointConversionRule = InferInsertModel<typeof pointConversionRules>;
export type UpdatePointConversionRule = Partial<InsertPointConversionRule>;
