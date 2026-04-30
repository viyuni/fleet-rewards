import { html } from '@elysia/html';
import Elysia from 'elysia';

export const email = new Elysia({ prefix: '/email' }).use(html()).get('/', () => {
  // return Bun;
});
