import {
  BadRequestError,
  ConflictError,
  InternalServerError,
  NotFoundError,
} from '#server/shared/errors';

/**
 * 积分类型不存在
 */
export class PointTypeNotFoundError extends NotFoundError {
  override code = 'POINT_TYPE_NOT_FOUND';

  constructor(message = '积分类型不存在') {
    super(message);
  }
}

/**
 * 积分类型编码已存在
 */
export class PointTypeCodeExistsError extends ConflictError {
  override code = 'POINT_TYPE_CODE_EXISTS';

  constructor(message = '积分类型编码已存在') {
    super(message);
  }
}

/**
 * 积分账户不存在
 */
export class PointAccountNotFoundError extends NotFoundError {
  override code = 'POINT_ACCOUNT_NOT_FOUND';

  constructor(message = '积分账户不存在') {
    super(message);
  }
}

/**
 * 积分余额不足
 */
export class PointBalanceInsufficientError extends ConflictError {
  override code = 'POINT_BALANCE_INSUFFICIENT';

  constructor(message = '积分余额不足') {
    super(message);
  }
}

/**
 * 确保积分账户失败
 */
export class PointAccountEnsureFailedError extends InternalServerError {
  override code = 'POINT_ACCOUNT_ENSURE_FAILED';

  constructor(message = '积分账户创建失败') {
    super(message);
  }
}

/**
 * 积分数量必须大于 0
 */
export class PointAmountInvalidError extends BadRequestError {
  override code = 'POINT_AMOUNT_INVALID';

  constructor(message = '积分数量必须大于 0') {
    super(message);
  }
}

/**
 * 积分账户更新失败
 */
export class PointAccountUpdateFailedError extends InternalServerError {
  override code = 'POINT_ACCOUNT_UPDATE_FAILED';

  constructor(message = '积分账户更新失败') {
    super(message);
  }
}

/**
 * 积分流水不存在
 */
export class PointTransactionNotFoundError extends NotFoundError {
  override code = 'POINT_TRANSACTION_NOT_FOUND';

  constructor(message = '积分流水不存在') {
    super(message);
  }
}

export const PointErrors = {
  PointTypeNotFoundError,
  PointTypeCodeExistsError,
  PointAccountNotFoundError,
  PointBalanceInsufficientError,
  PointAccountEnsureFailedError,
  PointAmountInvalidError,
  PointAccountUpdateFailedError,
  PointTransactionNotFoundError,
};
