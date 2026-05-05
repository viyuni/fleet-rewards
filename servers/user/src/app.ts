import { setupApp } from '@server/shared/setup-app';
import { Elysia } from 'elysia';

import { config } from './config';
import { logger } from './logger';
import { image } from './modules/image';
import { order } from './modules/order';
import { user } from './modules/user';

export const app = setupApp(new Elysia())
  .use(user)
  .use(order)
  .use(image)
  .listen({ port: config.SERVER_PORT }, logger.printUrls);
