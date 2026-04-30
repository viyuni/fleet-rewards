import { cors } from '@elysia/cors';
import { setupApp } from '@server/shared';
import { health } from '@server/shared/health';
import { Elysia } from 'elysia';

import { version } from '../package.json' with { type: 'json' };
import { config } from './config';
import { logger } from './logger';
import { admin } from './modules/admin';
import { auth } from './modules/auth';
import { email } from './modules/email/index';
import { image } from './modules/image';
import { pointType } from './modules/point-type';

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
  .use(auth)
  .use(admin)
  .use(pointType)
  .use(image)
  .use(email)
  .get('/', () => 'Viyuni guard rewards server running... :)', { tags: ['Index'] })
  .use(health())
  .listen({ port: config.SERVER_PORT }, logger.printUrls);
