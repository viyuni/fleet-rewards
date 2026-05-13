import { isNull, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';
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

import { deletedAt, timestamps } from './column-helpers';
import { pointTypes } from './point-type';

export const GuardType = {
  /** 总督 */
  Zongdu: 1,
  /** 提督 */
  Tidu: 2,
  /** 舰长 */
  Jianzhang: 3,
} as const;

export type GuardType = (typeof GuardType)[keyof typeof GuardType];

export type BiliGuardRewardRuleCondition = {
  type: 'biliGuard';

  /**
   * 大航海类型不填表示全部类型都可匹配
   */
  guardTypes?: GuardType[];
};

export type RewardRuleCondition = BiliGuardRewardRuleCondition;

/**
 * 积分奖励发放规则
 *
 * 生效时间:
 * - startsAt/endsAt 都为空: 常驻生效
 * - startsAt 为空: 直到 endsAt 前生效
 * - endsAt 为空: 从 startsAt 起常驻生效
 * - startsAt/endsAt 都有值: 只在时间窗口内生效
 *
 * 叠加规则:
 * - group 为空: 匹配后直接参与叠加
 * - group 有值: 同一个 group 内只取优先级最高的一条
 *
 */
export const rewardRules = pgTable(
  'reward_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /**
     * 名称
     */
    name: text('name').notNull(),

    /**
     * 描述
     */
    description: text('description'),

    /**
     * 例如:
     * {
     *   "type": "biliGuard",
     *   "guardTypes": [3]
     * }
     */
    conditions: jsonb('conditions').notNull().$type<RewardRuleCondition>(),

    /**
     * 积分类型 ID
     */
    pointTypeId: uuid('point_type_id')
      .notNull()
      .references(() => pointTypes.id),

    /**
     * 积分数
     */
    points: integer('points').notNull(),

    /**
     * 是否启用
     */
    enabled: boolean('enabled').notNull().default(false),

    /**
     * 互斥分组
     *
     * 有值时，同一 group 内只取优先级最高的一条
     * 为空时，匹配到的规则直接参与叠加
     */
    group: text('group'),

    /**
     * 生效开始时间为空表示不限制开始时间
     */
    startsAt: timestamp('starts_at', { withTimezone: true }),

    /**
     * 生效结束时间为空表示不限制结束时间
     */
    endsAt: timestamp('ends_at', { withTimezone: true }),

    /**
     * 优先级，数字越小优先级越高
     */
    priority: integer('priority').notNull().default(0),

    deletedAt,

    ...timestamps,
  },
  t => [
    uniqueIndex('reward_rules_active_unique').on(t.name).where(isNull(t.deletedAt)),
    index('reward_rules_point_type_id_idx').on(t.pointTypeId),
    index('reward_rules_enabled_idx').on(t.enabled),
    index('reward_rules_group_idx').on(t.group),
    index('reward_rules_time_range_idx').on(t.startsAt, t.endsAt),
    index('reward_rules_priority_idx').on(t.priority),
    index('reward_rules_enabled_priority_created_at_idx').on(t.enabled, t.priority, t.createdAt),
    index('reward_rules_priority_created_at_idx').on(t.priority, t.createdAt),
  ],
);

export type RewardRule = InferSelectModel<typeof rewardRules>;
export type InsertRewardRule = InferInsertModel<typeof rewardRules>;
export type UpdateRewardRule = Partial<InsertRewardRule>;
