import { type } from 'arktype';

/**
 * 积分类型 ID Params Schema。
 */
export const pointTypeIdParamsSchema = type({
  id: type('string').describe('积分类型 ID'),
});

export type PointTypeIdParams = typeof pointTypeIdParamsSchema.infer;

/**
 * 积分类型状态。
 */
export const PointTypeStatus = {
  Active: 'active',
  Disabled: 'disabled',
} as const;

/**
 * 积分类型状态 Schema。
 */
export const pointTypeStatusSchema = type.valueOf(PointTypeStatus).describe('积分类型状态');

export type PointTypeStatus = typeof pointTypeStatusSchema.infer;

/**
 * 积分类型名称 Schema。
 */
const pointTypeNameSchema = type('2 <= string <= 50').describe('积分类型名称');

/**
 * 积分类型描述 Schema。
 */
const pointTypeDescriptionSchema = type('string <= 50').describe('积分类型描述');

/**
 * 创建积分类型 Body Schema。
 */
export const createPointTypeSchema = type({
  name: pointTypeNameSchema,
  'description?': pointTypeDescriptionSchema,
});

export type CreatePointTypeBody = typeof createPointTypeSchema.infer;

/**
 * 更新积分类型 Body Schema。
 */
export const updatePointTypeSchema = type({
  'name?': pointTypeNameSchema,
  'description?': pointTypeDescriptionSchema,
});

export type UpdatePointTypeBody = typeof updatePointTypeSchema.infer;
