import Elysia from 'elysia';

export const healthModule = () =>
  new Elysia({ name: 'HealthModule', prefix: '/health' })
    .get('/', () => 'ok', {
      detail: {
        tags: ['Health'],
      },
    })
    .head('/', () => 'ok', {
      detail: {
        tags: ['Health'],
      },
    });
