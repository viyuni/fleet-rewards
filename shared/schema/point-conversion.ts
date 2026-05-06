import { type } from 'arktype';

import { nonceBodySchema } from './common';

/**
 * 积分转换规则 ID Params Schema。
 */
export const pointConversionRuleIdParamsSchema = type({
  id: type('string').describe('积分转换规则 ID'),
});

export type PointConversionRuleIdParams = typeof pointConversionRuleIdParamsSchema.infer;

/**
 * 积分转换规则名称 Schema。
 */
const conversionRuleNameSchema = type('2 <= string <= 80').describe('积分转换规则名称');

/**
 * 积分转换规则描述 Schema。
 */
const conversionRuleDescriptionSchema = type('string <= 200').describe('积分转换规则描述');

/**
 * 积分转换规则备注 Schema。
 */
const conversionRuleRemarkSchema = type('string <= 200').describe('备注');

/**
 * 正整数 Schema。
 */
const positiveIntegerSchema = type('number.integer > 0');

/**
 * 创建积分转换规则 Body Schema。
 */
export const createPointConversionRuleSchema = type({
  name: conversionRuleNameSchema,
  'description?': conversionRuleDescriptionSchema,
  'remark?': conversionRuleRemarkSchema,

  fromPointTypeId: type('string').describe('来源积分类型 ID'),
  toPointTypeId: type('string').describe('目标积分类型 ID'),

  fromAmount: positiveIntegerSchema.describe('来源积分数量'),
  toAmount: positiveIntegerSchema.describe('目标积分数量'),

  'minFromAmount?': positiveIntegerSchema.describe('单次最小来源积分数量'),
  'maxFromAmount?': positiveIntegerSchema.describe('单次最大来源积分数量'),

  'enabled?': type('boolean').describe('是否启用'),

  'startsAt?': type('number.integer').describe('生效时间戳'),
  'endsAt?': type('number.integer').describe('失效时间戳'),
});

export type CreatePointConversionRuleBody = typeof createPointConversionRuleSchema.infer;

/**
 * 更新积分转换规则 Body Schema。
 */
export const updatePointConversionRuleSchema = type({
  'name?': conversionRuleNameSchema,
  'description?': conversionRuleDescriptionSchema,
  'remark?': conversionRuleRemarkSchema,

  'fromPointTypeId?': type('string').describe('来源积分类型 ID'),
  'toPointTypeId?': type('string').describe('目标积分类型 ID'),

  'fromAmount?': positiveIntegerSchema.describe('来源积分数量'),
  'toAmount?': positiveIntegerSchema.describe('目标积分数量'),

  'minFromAmount?': positiveIntegerSchema.describe('单次最小来源积分数量'),
  'maxFromAmount?': positiveIntegerSchema.describe('单次最大来源积分数量'),

  'enabled?': type('boolean').describe('是否启用'),

  'startsAt?': type('number.integer').describe('生效时间戳'),
  'endsAt?': type('number.integer').describe('失效时间戳'),
});

export type UpdatePointConversionRuleBody = typeof updatePointConversionRuleSchema.infer;

/**
 * 积分转换 Body Schema。
 *
 * 用于用户按转换规则兑换积分。
 */
export const convertPointSchema = nonceBodySchema.and({
  ruleId: type('string').describe('积分转换规则 ID'),
  userId: type('string').describe('用户 ID'),
  fromAmount: positiveIntegerSchema.describe('来源积分数量'),
  'remark?': conversionRuleRemarkSchema,
});

export type ConvertPointBody = typeof convertPointSchema.infer;
