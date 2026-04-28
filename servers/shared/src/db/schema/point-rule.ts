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
import { pointTypes } from './point';

/**
 * 积分规则效果类型
 */
export const pointRuleEffectEnum = pgEnum('point_rule_effect', [
  /**
   * 固定增加积分
   */
  'add',

  /**
   * 按输入基数乘倍率
   *
   * 例如 baseAmount = 100, value = 2，则发放 200。
   */
  'multiply',
]);

/**
 * 积分发放规则表
 *
 * 不绑定固定 trigger。
 * 业务代码决定什么时候使用哪些规则。
 */
export const pointRules = pgTable(
  'point_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /**
     * 稳定业务编码。
     *
     * 示例：
     * captain_base
     * admiral_base
     * admiral_captain_bonus
     * governor_base
     * activity_bonus
     *
     * 程序应该引用 code 或 id，不要引用 name/remark。
     */
    code: text('code').notNull(),

    /**
     * 展示名称。
     *
     * 示例：
     * 舰长基础奖励
     */
    name: text('name').notNull(),

    /**
     * 规则说明 / 默认流水备注。
     */
    remark: text('remark'),

    /**
     * 目标积分类型。
     */
    pointTypeId: uuid('point_type_id')
      .notNull()
      .references(() => pointTypes.id),

    /**
     * 规则效果。
     */
    effect: pointRuleEffectEnum('effect').notNull().default('add'),

    /**
     * 规则值。
     *
     * effect = add 时：表示固定增加多少积分。
     * effect = multiply 时：表示倍率。
     *
     * 第一版用 integer 就够。
     * 如果以后需要 1.5 倍，再改成 numeric。
     */
    value: integer('value').notNull(),

    /**
     * 分组。
     *
     * 示例：
     * base     基础奖励
     * bonus    额外奖励
     * activity 活动奖励
     */
    group: text('group').notNull().default('base'),

    /**
     * 同一 group 下是否只允许命中一条规则。
     *
     * 例如活动积分只能拿一份，就设置为 true。
     */
    exclusiveInGroup: boolean('exclusive_in_group').notNull().default(false),

    /**
     * 优先级。
     *
     * exclusiveInGroup = true 时，可以取优先级最高的一条。
     */
    priority: integer('priority').notNull().default(0),

    /**
     * 是否启用。
     */
    enabled: boolean('enabled').notNull().default(true),

    /**
     * 生效开始时间。
     */
    startsAt: timestamp('starts_at', { withTimezone: true }),

    /**
     * 生效结束时间。
     */
    endsAt: timestamp('ends_at', { withTimezone: true }),

    /**
     * 自定义条件。
     *
     * 第一版可以不使用。
     * 后面如果后台要做规则配置，可以放一些条件。
     *
     * 示例：
     * {
     *   "minAmount": 100,
     *   "onlyFirstTime": true
     * }
     */
    conditions: jsonb('conditions'),

    metadata: jsonb('metadata'),

    ...timestamps,
  },
  t => [
    uniqueIndex('point_rules_code_unique').on(t.code),
    index('point_rules_point_type_id_idx').on(t.pointTypeId),
    index('point_rules_enabled_idx').on(t.enabled),
    index('point_rules_group_idx').on(t.group),
    index('point_rules_time_range_idx').on(t.startsAt, t.endsAt),
    index('point_rules_sort_idx').on(t.priority),
  ],
);
