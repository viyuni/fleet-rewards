import { type } from 'arktype';
import { Elysia } from 'elysia';

import { Errors } from '#server/shared/errors';
import { setupApp } from '#server/shared/setup-app';

export const app = setupApp(new Elysia())
  .get('/', () => 'Hello World')
  .get('/error', () => {
    throw new Errors.NotFoundError();
  })
  .post(
    '/schema',
    ({ body }) => {
      return body;
    },
    {
      body: type({
        name: 'string > 5',
        age: 'string.numeric.parse',
      }),
    },
  );
