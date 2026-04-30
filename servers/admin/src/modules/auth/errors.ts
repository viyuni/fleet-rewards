import { ConflictError, ForbiddenError } from '@server/shared';

export class AlreadyExistsError extends ConflictError {
  override code = 'ADMIN_ALREADY_EXISTS';

  constructor(message = '管理员用户名已存在') {
    super(message);
  }
}

export class DisabledError extends ForbiddenError {
  override code = 'ADMIN_DISABLED';

  constructor(message = '管理员账号已被禁用') {
    super(message);
  }
}

export const AuthErrors = {
  AlreadyExistsError,
  DisabledError,
};
