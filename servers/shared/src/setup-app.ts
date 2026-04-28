import { openapi } from '@elysia/openapi';
import { type Elysia } from 'elysia';

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
    .onError(({ code, error }) => {
      if (code === 'VALIDATION') {
        return {
          message: error.valueError?.message,
          errors: error.all.map(({ value: _value, message: _message, ...rest }) => rest),
        };
      }
    });
}
