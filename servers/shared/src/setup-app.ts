import { openapi } from '@elysia/openapi';
import { ValidationError, type Elysia } from 'elysia';

import { BaseErrors } from './errors';

export function setupApp<T extends Elysia>(app: T) {
  return app
    .use(
      openapi({
        documentation: {
          components: {
            securitySchemes: {
              requiredAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: '输入 JWT Token',
              },
            },
          },
        },
      }),
    )
    .error(BaseErrors)
    .onError(({ error, status }) => {
      if (error instanceof ValidationError) {
        return status(422, {
          code: 'REQUEST_VALIDATION_ERROR',
          message: error.valueError?.message ?? '参数错误',
          details: error.all.map(({ value: _value, message: _message, ...rest }) => rest),
        });
      }
    });
}
