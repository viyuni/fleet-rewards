import { cors } from '@elysia/cors';
import { setupApp } from '@server/shared';
import { healthModule } from '@server/shared/health';
import { Elysia } from 'elysia';

import { version } from '../package.json' with { type: 'json' };
import { config } from './config';
import { logger } from './logger';
import { admin } from './modules/admin';
import { auth, authGuard } from './modules/auth';
import { email } from './modules/email/index';
import { image } from './modules/image';
import { order } from './modules/order';
import { point } from './modules/point';
import { product } from './modules/product';
import { reward } from './modules/reward';
import { users } from './modules/users';

logger.info(config);

export const app = setupApp(
  new Elysia({
    name: 'Admin',
  }),
  {
    title: 'Viyuni Guard Rewards',
    version,
  },
)
  .use(cors({ origin: '*', allowedHeaders: ['Content-Type', 'Authorization'] }))
  .use(authGuard)
  .use(auth)
  .use(admin)
  .use(point)
  .use(reward)
  .use(product)
  .use(order)
  .use(users)
  .use(image)
  .use(email)
  .use(healthModule())
  .get('/', () => 'Viyuni guard rewards server running... :)', { tags: ['Index'] })
  .listen({ port: config.PORT }, logger.printUrls);
