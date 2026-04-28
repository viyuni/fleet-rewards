import { BaseErrors } from '@gr/server-shared/errors';

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

export const UserErrors = {
  UserAlreadyExistsError,
  UserBannedError,
};
