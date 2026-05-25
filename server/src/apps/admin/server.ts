import { cors } from '@elysia/cors';
import { Elysia } from 'elysia';

import { errorHandler } from '#modules/error-handler';
import { health } from '#modules/health';
import { image } from '#modules/image';
import { openapi } from '#modules/openapi';
import { version } from '~/package.json' with { type: 'json' };

import { appRuntimeContext } from './context';
import { admin } from './modules/admin';
import { auth } from './modules/auth';
import { dashboard } from './modules/dashboard';
import { order } from './modules/order';
import { point } from './modules/point';
import { product } from './modules/product';
import { reward } from './modules/reward';
import { user } from './modules/user';
import { adminEnv } from './utils';

export const app = new Elysia({
  name: 'AdminServer',
  serve: {
    port: adminEnv.ADMIN_PORT,
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
  .use(auth)
  .use(dashboard)
  .use(admin)
  .use(point)
  .use(reward)
  .use(product)
  .use(order)
  .use(user)
  .use(health)
  .use(image)
  .get('/', () => 'Viyuni guard rewards server running... :)', { tags: ['Index'] });

if (adminEnv.NODE_ENV === 'development') {
  app.use(
    openapi({
      title: 'Viyuni Guard Plus',
      version,
    }),
  );
}
