import { config } from '@gr/server-shared';
import { setupApp } from '@gr/server-shared/setup-app';
import { printUrls } from '@gr/server-shared/utils';
import { Elysia } from 'elysia';

import { user } from './modules/user';

export const app = setupApp(new Elysia())
  .use(user)
  .listen({ port: config.USER_SERVER_PORT }, server => printUrls(server));
