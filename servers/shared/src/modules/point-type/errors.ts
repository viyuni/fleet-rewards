import { ConflictError, NotFoundError } from '#server/shared/errors';

export class PointTypeNotFoundError extends NotFoundError {
  override code = 'POINT_TYPE_NOT_FOUND';
  constructor(message = '积分类型不存在') {
    super(message);
  }
}

export class PointTypeCodeExistsError extends ConflictError {
  override code = 'POINT_TYPE_CODE_EXISTS';
  constructor(message = '积分类型编码已存在') {
    super(message);
  }
}

export const PointTypeErrors = {
  PointTypeNotFoundError,
};
