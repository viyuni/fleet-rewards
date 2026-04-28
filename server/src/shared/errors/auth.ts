import { BaseErrors } from '#server/shared/errors';

export class UserAlreadyExistsError extends BaseErrors.ConflictError {
  override code = 'USER_ALREADY_EXISTS';

  constructor(message = '用户用户名已存在') {
    super(message);
  }
}

export class UserBannedError extends BaseErrors.ForbiddenError {
  override code = 'USER_BANNED';

  constructor(message = '用户账号已被封禁') {
    super(message);
  }
}

export class InvalidCredentialsError extends BaseErrors.UnauthorizedError {
  override code = 'INVALID_CREDENTIALS';

  constructor(message = '用户名或密码错误') {
    super(message);
  }
}

export class WeakPasswordError extends BaseErrors.BadRequestError {
  override code = 'WEAK_PASSWORD';

  constructor(message = '密码强度不足') {
    super(message);
  }
}
