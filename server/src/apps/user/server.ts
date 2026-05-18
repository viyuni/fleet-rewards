import cors from '@elysia/cors';
import { Elysia } from 'elysia';

import { errorHandler } from '#modules/error-handler';
import { image } from '#modules/image';
import { openapi } from '#modules/openapi';

import { version } from '../../../package.json' with { type: 'json' };
import { appRuntimeContext } from './context';
import { userEnv } from './env';
import { auth } from './modules/auth';
import { order } from './modules/order';
import { pointTransaction } from './modules/point-transaction';
import { product } from './modules/product';
import { user } from './modules/user';

export const app = new Elysia({
  serve: {
    port: userEnv.USER_PORT,
    reusePort: true,
  },
})
  .use(
    cors({
      origin: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
      credentials: true,
    }),
  )
  .use(appRuntimeContext)
  .use(errorHandler)
  .use(image)
  .use(auth)
  .use(user)
  .use(product)
  .use(pointTransaction)
  .use(order);

if (userEnv.NODE_ENV === 'development') {
  app.use(
    openapi({
      title: 'Viyuni Guard Rewards',
      version,
    }),
  );
}
