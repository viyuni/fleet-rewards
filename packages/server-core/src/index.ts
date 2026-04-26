import { Elysia } from 'elysia';

export function createElysiaApp() {
  return new Elysia().get('/', () => 'Hello Elysia');
}
