import { type } from 'arktype';

export const pointTypeIdParamsSchema = type({
  id: type('string').describe('积分类型ID'),
});

const pointTypeNameSchema = type('2 <= string <= 50').describe('积分类型名称');
const pointTypeDescriptionSchema = type('string <= 50').describe('积分类型描述');

export const createPointTypeSchema = type({
  name: pointTypeNameSchema,
  description: pointTypeDescriptionSchema.optional(),
});

export const pointTypePageQuerySchema = type({
  page: type('number').describe('页码').optional(),
  pageSize: type('number').describe('每页数量').optional(),
  status: type('"active"|"disabled"').describe('积分类型状态').optional(),
  keyword: type('string').describe('搜索关键字').optional(),
});

export const updatePointTypeSchema = type({
  name: pointTypeNameSchema.optional(),
  description: pointTypeDescriptionSchema.optional(),
});

export const adjustBalanceSchema = type({
  accountId: type('string').default('账户 ID'),
  delta: type('number.integer').describe('积分数量'),
  remark: type('string').describe('备注').optional(),
  requestId: type('string.uuid').describe('请求 ID'),
});

export const reversalTransactionSchema = type({
  transactionId: type('string').describe('积分流水 ID'),
  remark: type('string').describe('备注').optional(),
});

export const transactionPageQuerySchema = type({
  page: type('number').describe('页码').optional(),
  pageSize: type('number').describe('每页数量').optional(),
  type: type('"grant"|"consume"| "refund"| "adjust"| "reversal"')
    .describe('积分流水类型')
    .optional(),
  pointTypeId: type('string').describe('积分类型 ID').optional(),
  startTime: type('number').describe('开始时间').optional(),
  endTime: type('number').describe('结束时间').optional(),
  userId: type('string').describe('用户 ID').optional(),
});

export const pointConversionRuleIdParamsSchema = type({
  id: type('string').describe('积分转换规则 ID'),
});

const conversionRuleNameSchema = type('2 <= string <= 80').describe('积分转换规则名称');
const positiveIntegerSchema = type('number.integer > 0');

export const createPointConversionRuleSchema = type({
  name: conversionRuleNameSchema,
  description: type('string <= 200').describe('积分转换规则描述').optional(),
  remark: type('string <= 200').describe('备注').optional(),
  fromPointTypeId: type('string').describe('来源积分类型 ID'),
  toPointTypeId: type('string').describe('目标积分类型 ID'),
  fromAmount: positiveIntegerSchema.describe('来源积分数量'),
  toAmount: positiveIntegerSchema.describe('目标积分数量'),
  minFromAmount: positiveIntegerSchema.describe('单次最小来源积分数量').optional(),
  maxFromAmount: positiveIntegerSchema.describe('单次最大来源积分数量').optional(),
  enabled: type('boolean').describe('是否启用').optional(),
  startsAt: type('number').describe('生效时间戳').optional(),
  endsAt: type('number').describe('失效时间戳').optional(),
});

export const updatePointConversionRuleSchema = type({
  name: conversionRuleNameSchema.optional(),
  description: type('string <= 200').describe('积分转换规则描述').optional(),
  remark: type('string <= 200').describe('备注').optional(),
  fromPointTypeId: type('string').describe('来源积分类型 ID').optional(),
  toPointTypeId: type('string').describe('目标积分类型 ID').optional(),
  fromAmount: positiveIntegerSchema.describe('来源积分数量').optional(),
  toAmount: positiveIntegerSchema.describe('目标积分数量').optional(),
  minFromAmount: positiveIntegerSchema.describe('单次最小来源积分数量').optional(),
  maxFromAmount: positiveIntegerSchema.describe('单次最大来源积分数量').optional(),
  enabled: type('boolean').describe('是否启用').optional(),
  startsAt: type('number').describe('生效时间戳').optional(),
  endsAt: type('number').describe('失效时间戳').optional(),
});

export const pointConversionRuleQuerySchema = type({
  enabled: type('boolean').describe('是否启用').optional(),
  fromPointTypeId: type('string').describe('来源积分类型 ID').optional(),
  toPointTypeId: type('string').describe('目标积分类型 ID').optional(),
  keyword: type('string').describe('搜索关键字').optional(),
});

export const convertPointSchema = type({
  ruleId: type('string').describe('积分转换规则 ID'),
  userId: type('string').describe('用户 ID'),
  fromAmount: positiveIntegerSchema.describe('来源积分数量'),
  requestId: type('string.uuid').describe('请求 ID'),
  remark: type('string').describe('备注').optional(),
});

export type CreatePointTypeInput = typeof createPointTypeSchema.infer;
export type UpdatePointTypeInput = typeof updatePointTypeSchema.infer;
export type AdjustBalanceInput = typeof adjustBalanceSchema.infer;
export type ReversalTransactionInput = typeof reversalTransactionSchema.infer;
export type PointTypePageQuery = typeof pointTypePageQuerySchema.infer;
export type TransactionPageQuery = typeof transactionPageQuerySchema.infer;
export type CreatePointConversionRuleInput = typeof createPointConversionRuleSchema.infer;
export type UpdatePointConversionRuleInput = typeof updatePointConversionRuleSchema.infer;
export type PointConversionRuleQuery = typeof pointConversionRuleQuerySchema.infer;
export type ConvertPointInput = typeof convertPointSchema.infer;
