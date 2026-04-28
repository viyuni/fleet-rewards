import { openapi } from '@elysia/openapi';
import { type Elysia } from 'elysia';

import { BaseErrors } from './errors';

export function setupApp<T extends Elysia>(app: T) {
  return app.error(BaseErrors).use(openapi());
}
