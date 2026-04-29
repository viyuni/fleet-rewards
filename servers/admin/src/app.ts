import { cors } from '@elysia/cors';
import { setupApp } from '@gr/server-shared';
import { Elysia } from 'elysia';

import { config } from './config';
import { logger } from './logger';
import { admin } from './modules/admin';

export const app = setupApp(new Elysia({ name: 'AdminApp' }))
  .use(cors({ origin: '*', allowedHeaders: ['Content-Type', 'Authorization'] }))
  .use(admin)
  .listen({ port: config.SERVER_PORT }, logger.printUrls);
