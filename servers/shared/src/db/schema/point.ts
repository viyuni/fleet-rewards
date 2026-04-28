import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  uuid,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

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
     * disabled 后历史数据仍可查询，但不允许继续发放。
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

/**
 * 用户积分账户表
 *
 * 一个用户针对一种积分类型只有一个账户。
 */
export const pointAccounts = pgTable(
  'point_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /**
     * 用户 ID。
     */
    userId: text('user_id').notNull(),

    /**
     * 积分类型 ID。
     */
    pointTypeId: uuid('point_type_id')
      .notNull()
      .references(() => pointTypes.id),

    /**
     * 当前可用余额。
     */
    balance: integer('balance').notNull().default(0),

    /**
     * 历史累计获得积分。
     */
    totalEarned: integer('total_earned').notNull().default(0),

    /**
     * 历史累计消耗积分。
     */
    totalConsumed: integer('total_consumed').notNull().default(0),

    /**
     * 是否启用账户。
     *
     * false 时不允许继续消费/获得该积分。
     */
    enabled: boolean('enabled').notNull().default(true),

    metadata: jsonb('metadata'),

    ...timestamps,
  },
  t => [
    uniqueIndex('point_accounts_user_id_point_type_id_unique').on(t.userId, t.pointTypeId),
    index('point_accounts_user_id_idx').on(t.userId),
    index('point_accounts_point_type_id_idx').on(t.pointTypeId),
  ],
);

/**
 * 积分流水类型
 */
export const pointTransactionTypeEnum = pgEnum('point_transaction_type', [
  /**
   * 发放积分
   */
  'grant',

  /**
   * 消费积分
   */
  'consume',

  /**
   * 退款返还积分
   */
  'refund',

  /**
   * 管理员手动调整
   */
  'adjust',

  /**
   * 冲正流水
   */
  'reversal',
]);

/**
 * 积分流水表
 *
 * 所有积分变动都必须写入这里。
 *
 * 约定：
 * - amount > 0 表示增加积分
 * - amount < 0 表示扣除积分
 * - 不物理删除流水
 * - 修正错误用 reversal 冲正
 */
export const pointTransactions = pgTable(
  'point_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /**
     * 用户 ID
     */
    userId: uuid('user_id').notNull(),

    /**
     * 积分账户 ID
     */
    accountId: uuid('account_id')
      .notNull()
      .references(() => pointAccounts.id),

    /**
     * 积分类型 ID
     *
     * 冗余一份 pointTypeId 是为了查询流水时不用总是 join account。
     */
    pointTypeId: uuid('point_type_id')
      .notNull()
      .references(() => pointTypes.id),

    /**
     * 流水类型
     */
    type: pointTransactionTypeEnum('type').notNull(),

    /**
     * 变动数量
     *
     * 发放：正数
     * 消费：负数
     * 退款：正数
     * 冲正：根据被冲正流水反向写入
     */
    amount: integer('amount').notNull(),

    /**
     * 变动前余额
     */
    balanceBefore: integer('balance_before').notNull(),

    /**
     * 变动后余额
     */
    balanceAfter: integer('balance_after').notNull(),

    /**
     * 来源类型
     *
     * 示例：
     * live_event
     * reward_order
     * admin_adjustment
     * order_refund
     */
    sourceType: text('source_type'),

    /**
     * 来源 ID
     *
     * 示例：
     * 订单 ID、直播事件 ID、管理员操作 ID。
     */
    sourceId: text('source_id'),

    /**
     * 幂等键
     *
     * 用于避免重复发放、重复扣款、重复退款。
     *
     * 示例：
     * live_event:bilibili:xxxx
     * reward_order:orderId:consume
     * reward_order:orderId:refund
     */
    idempotencyKey: text('idempotency_key').unique(),

    /**
     * 流水备注
     *
     * 示例：
     * 兑换商品：钥匙扣
     * 管理员补发积分
     * 订单退款返还积分
     */
    remark: text('remark'),

    /**
     * 原始上下文
     *
     * 可以保存事件 payload、订单快照、管理员信息等。
     */
    metadata: jsonb('metadata'),

    /**
     * 如果这是冲正流水，指向被冲正的流水。
     */
    reversalOfTransactionId: uuid('reversal_of_transaction_id'),

    ...timestamps,
  },
  t => [
    index('point_transactions_user_id_idx').on(t.userId),
    index('point_transactions_account_id_idx').on(t.accountId),
    index('point_transactions_point_type_id_idx').on(t.pointTypeId),
    index('point_transactions_type_idx').on(t.type),
    index('point_transactions_source_idx').on(t.sourceType, t.sourceId),
  ],
);
