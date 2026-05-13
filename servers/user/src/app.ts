import { errorHandler } from '@server/shared/error-handler';
import { image } from '@server/shared/image';
import { openapi } from '@server/shared/openapi';
import { Elysia } from 'elysia';

import { appContext } from './context';
import { env } from './env';
import { logger } from './logger';
import { auth } from './modules/auth';
import { order } from './modules/order';
import { pointTransaction } from './modules/point-transaction';
import { product } from './modules/product';
import { user } from './modules/user';

export const app = new Elysia()
  .use(openapi())
  .use(errorHandler)
  .use(image(env))
  .use(appContext)
  .use(auth)
  .use(user)
  .use(product)
  .use(pointTransaction)
  .use(order)
  .listen({ port: env.PORT }, logger.printUrls);
