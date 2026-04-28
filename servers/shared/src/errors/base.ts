export abstract class AppError extends Error {
  abstract readonly status: number;
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class BadRequestError extends AppError {
  status = 400;
  code = 'BAD_REQUEST';

  constructor(message = '请求参数错误') {
    super(message);
  }
}

export class UnauthorizedError extends AppError {
  status = 401;
  code = 'UNAUTHORIZED';

  constructor(message = '未登录或登录已过期') {
    super(message);
  }
}

export class ForbiddenError extends AppError {
  status = 403;
  code = 'FORBIDDEN';

  constructor(message = '没有权限执行该操作') {
    super(message);
  }
}

export class NotFoundError extends AppError {
  status = 404;
  code = 'NOT_FOUND';

  constructor(message = '资源不存在') {
    super(message);
  }
}

export class ConflictError extends AppError {
  status = 409;
  code = 'CONFLICT';

  constructor(message = '资源状态冲突') {
    super(message);
  }
}

export class InvalidCredentialsError extends UnauthorizedError {
  constructor(message = '用户名或密码错误') {
    super(message);
  }
}

export const BaseErrors = {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
};
