import type { Elysia } from 'elysia';

export function setupApp<T extends Elysia>(app: T) {
  return app;
}
