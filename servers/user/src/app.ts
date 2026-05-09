import { errorHandler } from '@server/shared/error-handler';
import { openapi } from '@server/shared/openapi';
import { Elysia } from 'elysia';

import { appContext } from './context';
import { env } from './env';
import { logger } from './logger';
import { order } from './modules/order';
import { user } from './modules/user';
export const app = new Elysia()
  .use(openapi())
  .use(errorHandler)
  .use(appContext)
  .use(user)
  .use(order)
  .listen({ port: env.PORT }, logger.printUrls);
