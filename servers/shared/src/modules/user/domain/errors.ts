import { AppError, NotFoundError } from '#server/shared/errors';

export class UserNotFoundError extends NotFoundError {
  constructor() {
    super('用户不存在');
  }
}

/**
 * 用户不可用
 */
export class UserUnavailableError extends AppError {
  status = 400;
  code = 'USER_UNAVAILABLE';

  constructor(message = '用户不可用') {
    super(message);
  }
}
