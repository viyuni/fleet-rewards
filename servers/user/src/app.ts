import { setupApp } from '@gr/server-shared/setup-app';
import { Elysia } from 'elysia';

import { config } from './config';
import { logger } from './logger';
import { user } from './modules/user';

export const app = setupApp(new Elysia())
  .use(user)
  .listen({ port: config.SERVER_PORT }, logger.printUrls);
