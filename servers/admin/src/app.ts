import { cors } from '@elysia/cors';
import { config, printUrls, setupApp } from '@gr/server-shared';
import { Elysia } from 'elysia';

import { admin } from './modules/admin';

export const app = setupApp(new Elysia({ name: 'AdminApp' }))
  .use(cors({ origin: '*', allowedHeaders: ['Content-Type', 'Authorization'] }))
  .use(admin)
  .listen({ port: config.ADMIN_SERVER_PORT }, server => printUrls(server));
