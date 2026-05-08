import { cors } from '@elysia/cors';
import { errorHandler } from '@server/shared/error-handler';
import { health } from '@server/shared/health';
import { openapi } from '@server/shared/openapi';
import { Elysia } from 'elysia';

import { version } from '../package.json' with { type: 'json' };
import { initDefaultAdmin } from './context';
import { admin } from './modules/admin';
import { auth } from './modules/auth';
import { email } from './modules/email/index';
import { order } from './modules/order';
import { point } from './modules/point';
import { product } from './modules/product';
import { reward } from './modules/reward';
import { users } from './modules/users';
import { config } from './utils/config';
import { logger } from './utils/logger';

export const app = new Elysia({
  name: 'AdminServer',
})
  .use(
    cors({
      origin: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
      credentials: true,
    }),
  )
  .use(errorHandler)
  .use(auth)
  .use(admin)
  .use(point)
  .use(reward)
  .use(product)
  .use(order)
  .use(users)
  .use(email)
  .use(health)
  .get('/', () => 'Viyuni guard rewards server running... :)', { tags: ['Index'] });

if (config.NODE_ENV === 'development') {
  app.use(
    openapi({
      title: 'Viyuni Guard Rewards',
      version,
    }),
  );
}

app.listen({ port: config.PORT }, logger.printUrls);

await initDefaultAdmin();
