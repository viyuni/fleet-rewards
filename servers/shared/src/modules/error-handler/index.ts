import { SQL } from 'bun';
import Elysia, { ValidationError } from 'elysia';

export function errorHandler<T extends Elysia>(app: T): T {
  app.onError(({ error, status, code }) => {
    if (error instanceof ValidationError) {
      return status(422, {
        code: 'REQUEST_VALIDATION_ERROR',
        message: error.valueError?.message ?? '参数错误',
        details: error.all.map(({ value: _value, message: _message, ...rest }) => rest),
      });
    }

    if (code === 500 || code === 'UNKNOWN' || error instanceof SQL.PostgresError) {
      return status(500, {
        code: 'INTERNAL_SERVER_ERROR',
        message: '服务器内部错误',
      });
    }
  });

  return app;
}
