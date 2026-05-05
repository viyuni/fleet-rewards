import { type } from 'arktype';

export const rewardRuleIdParamsSchema = type({
  id: type('string').describe('积分奖励规则 ID'),
});

const rewardRuleNameSchema = type('2 <= string <= 80').describe('积分奖励规则名称');
const positiveIntegerSchema = type('number.integer > 0');
const guardTypeSchema = type('1 | 2 | 3');

export const rewardRuleConditionSchema = type({
  type: '"biliGuard"',
  guardTypes: guardTypeSchema.array().describe('大航海类型').optional(),
});

export const createRewardRuleSchema = type({
  name: rewardRuleNameSchema,
  remark: type('string <= 200').describe('备注').optional(),
  conditions: rewardRuleConditionSchema,
  pointTypeId: type('string').describe('积分类型 ID'),
  points: positiveIntegerSchema.describe('奖励积分数'),
  enabled: type('boolean').describe('是否启用').optional(),
  group: type('string <= 80').describe('互斥分组').optional(),
  startsAt: type('number').describe('生效开始时间戳').optional(),
  endsAt: type('number').describe('生效结束时间戳').optional(),
  priority: type('number.integer').describe('优先级，数字越小优先级越高').optional(),
});

export const updateRewardRuleSchema = type({
  name: rewardRuleNameSchema.optional(),
  remark: type('string <= 200').describe('备注').optional(),
  conditions: rewardRuleConditionSchema.optional(),
  pointTypeId: type('string').describe('积分类型 ID').optional(),
  points: positiveIntegerSchema.describe('奖励积分数').optional(),
  enabled: type('boolean').describe('是否启用').optional(),
  group: type('string <= 80').describe('互斥分组').optional(),
  startsAt: type('number').describe('生效开始时间戳').optional(),
  endsAt: type('number').describe('生效结束时间戳').optional(),
  priority: type('number.integer').describe('优先级，数字越小优先级越高').optional(),
});

export const rewardRulePageQuerySchema = type({
  page: type('number').describe('页码').optional(),
  pageSize: type('number').describe('每页数量').optional(),
  enabled: type('boolean').describe('是否启用').optional(),
  pointTypeId: type('string').describe('积分类型 ID').optional(),
  group: type('string').describe('互斥分组').optional(),
  keyword: type('string').describe('搜索关键字').optional(),
});

export type CreateRewardRuleInput = typeof createRewardRuleSchema.infer;
export type UpdateRewardRuleInput = typeof updateRewardRuleSchema.infer;
export type RewardRulePageQuery = typeof rewardRulePageQuerySchema.infer;
