export abstract class HttpError extends Error {
  abstract readonly status: number;
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class BadRequestError extends HttpError {
  status = 400;
  code = 'BAD_REQUEST';

  constructor(message = '请求参数错误') {
    super(message);
  }
}

export class UnauthorizedError extends HttpError {
  status = 401;
  code = 'UNAUTHORIZED';

  constructor(message = '未登录或登录已过期') {
    super(message);
  }
}

export class ForbiddenError extends HttpError {
  status = 403;
  code = 'FORBIDDEN';

  constructor(message = '没有权限执行该操作') {
    super(message);
  }
}

export class NotFoundError extends HttpError {
  status = 404;
  code = 'NOT_FOUND';

  constructor(message = '资源不存在') {
    super(message);
  }
}

export class ConflictError extends HttpError {
  status = 409;
  code = 'CONFLICT';

  constructor(message = '资源状态冲突') {
    super(message);
  }
}

export class ValidationError extends HttpError {
  status = 422;
  code = 'VALIDATION_ERROR';

  constructor(message = '数据校验失败') {
    super(message);
  }
}
