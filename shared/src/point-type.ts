import * as v from 'valibot';

import { emptyable } from './common';

/**
 * 积分类型 ID Params Schema。
 */
export const PointTypeIdParamsSchema = v.object({
  pointTypeId: v.pipe(v.string('请输入积分类型 ID'), v.description('积分类型 ID')),
});

export type PointTypeIdParams = v.InferOutput<typeof PointTypeIdParamsSchema>;

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
export const PointTypeStatusSchema = v.pipe(
  v.enum(PointTypeStatus, '请选择有效的积分类型状态'),
  v.description('积分类型状态'),
);

export type PointTypeStatus = v.InferOutput<typeof PointTypeStatusSchema>;

/**
 * 积分类型名称 Schema。
 */
const PointTypeNameSchema = v.pipe(
  v.string('请输入积分类型名称'),
  v.minLength(2, '积分类型名称不能少于 2 个字符'),
  v.maxLength(50, '积分类型名称不能超过 50 个字符'),
  v.description('积分类型名称'),
);

/**
 * 积分类型描述 Schema。
 */
const PointTypeDescriptionSchema = v.pipe(
  v.string('请输入积分类型描述'),
  v.maxLength(50, '积分类型描述不能超过 50 个字符'),
  v.description('积分类型描述'),
);

/**
 * 创建积分类型 Body Schema。
 */
export const CreatePointTypeSchema = v.object({
  name: PointTypeNameSchema,
  description: v.optional(emptyable(PointTypeDescriptionSchema)),
});

export type CreatePointTypeBody = v.InferOutput<typeof CreatePointTypeSchema>;

/**
 * 更新积分类型 Body Schema。
 */
export const UpdatePointTypeSchema = v.object({
  name: v.optional(PointTypeNameSchema),
  description: v.nullish(emptyable(PointTypeDescriptionSchema)),
});

export type UpdatePointTypeBody = v.InferOutput<typeof UpdatePointTypeSchema>;
