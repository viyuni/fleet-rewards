import { openapi } from '@elysia/openapi';
import type { Elysia } from 'elysia';

import { Errors } from './errors';
import { HttpError } from './errors/common-errors';

export function setupApp<T extends Elysia>(app: T) {
  return app
    .error(Errors)
    .use(openapi())
    .onError(({ error, status }) => {
      if (error instanceof HttpError) {
        return status(error.status, error.message);
      }
    });
}
