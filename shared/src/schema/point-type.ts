import { type } from 'arktype';

export const pointTypeIdParamsSchema = type({
  id: type('string').describe('积分类型ID'),
});

const pointTypeNameSchema = type('2 <= string <= 50').describe('积分类型名称');
const pointTypeCodeSchema = type('2 <= string <= 50').describe('积分类型编码');
const pointTypeDescriptionSchema = type('string <= 50').describe('积分类型描述');

export const createPointTypeSchema = type({
  code: pointTypeNameSchema,
  name: pointTypeCodeSchema,
  description: pointTypeCodeSchema.optional(),
});

export const updatePointTypeSchema = type({
  name: pointTypeNameSchema.optional(),
  description: pointTypeDescriptionSchema.optional(),
});

export type CreatePointTypeInput = typeof createPointTypeSchema.infer;
export type UpdatePointTypeInput = typeof updatePointTypeSchema.infer;
