import { type } from 'arktype';

import { keywordQuerySchema, pageQuerySchema } from './common';

/**
 * 积分奖励规则 ID Params Schema。
 */
export const rewardRuleIdParamsSchema = type({
  id: type('string').describe('积分奖励规则 ID'),
});

export type RewardRuleIdParams = typeof rewardRuleIdParamsSchema.infer;

/**
 * 积分奖励规则名称 Schema。
 */
const rewardRuleNameSchema = type('2 <= string <= 80').describe('积分奖励规则名称');

/**
 * 积分奖励规则备注 Schema。
 */
const rewardRuleRemarkSchema = type('string <= 200').describe('备注');

/**
 * 互斥分组 Schema。
 */
const rewardRuleGroupSchema = type('1 <= string <= 80').describe('互斥分组');

/**
 * 正整数 Schema。
 */
const positiveIntegerSchema = type('number.integer > 0');

/**
 * 大航海类型。
 *
 * 1：总督
 * 2：提督
 * 3：舰长
 */
export const BiliGuardType = {
  /** 总督 */
  Zongdu: 1,

  /** 提督 */
  Tidu: 2,

  /** 舰长 */
  Jianzhang: 3,
} as const;

/**
 * 大航海类型 Schema。
 */
export const biliGuardTypeSchema = type.valueOf(BiliGuardType).describe('大航海类型');

export type BiliGuardType = typeof biliGuardTypeSchema.infer;

/**
 * 大航海奖励条件 Schema。
 */
export const biliGuardRewardConditionSchema = type({
  type: type("'biliGuard'").describe('条件类型'),
  'guardTypes?': biliGuardTypeSchema.array().describe('大航海类型'),
});

export type BiliGuardRewardCondition = typeof biliGuardRewardConditionSchema.infer;

/**
 * 积分奖励规则条件 Schema。
 */
export const rewardRuleConditionSchema = biliGuardRewardConditionSchema;

export type RewardRuleCondition = typeof rewardRuleConditionSchema.infer;

/**
 * 积分奖励规则分页查询 Query Schema。
 */
export const rewardRulePageQuerySchema = pageQuerySchema.and(keywordQuerySchema).and({
  'enabled?': type('boolean').describe('是否启用'),
  'pointTypeId?': type('string').describe('积分类型 ID'),
  'group?': rewardRuleGroupSchema,
});

export type RewardRulePageQuery = typeof rewardRulePageQuerySchema.infer;

/**
 * 创建积分奖励规则 Body Schema。
 */
export const createRewardRuleSchema = type({
  name: rewardRuleNameSchema,
  'remark?': rewardRuleRemarkSchema,

  conditions: rewardRuleConditionSchema,

  pointTypeId: type('string').describe('积分类型 ID'),
  points: positiveIntegerSchema.describe('奖励积分数'),

  'enabled?': type('boolean').describe('是否启用'),
  'group?': rewardRuleGroupSchema,

  'startsAt?': type('number.integer').describe('生效开始时间戳'),
  'endsAt?': type('number.integer').describe('生效结束时间戳'),

  'priority?': type('number.integer').describe('优先级，数字越小优先级越高'),
});

export type CreateRewardRuleBody = typeof createRewardRuleSchema.infer;

/**
 * 更新积分奖励规则 Body Schema。
 */
export const updateRewardRuleSchema = type({
  'name?': rewardRuleNameSchema,
  'remark?': rewardRuleRemarkSchema,

  'conditions?': rewardRuleConditionSchema,

  'pointTypeId?': type('string').describe('积分类型 ID'),
  'points?': positiveIntegerSchema.describe('奖励积分数'),

  'enabled?': type('boolean').describe('是否启用'),
  'group?': rewardRuleGroupSchema,

  'startsAt?': type('number.integer').describe('生效开始时间戳'),
  'endsAt?': type('number.integer').describe('生效结束时间戳'),

  'priority?': type('number.integer').describe('优先级，数字越小优先级越高'),
});

export type UpdateRewardRuleBody = typeof updateRewardRuleSchema.infer;
