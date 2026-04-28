import { Elysia } from 'elysia';

import { admin } from '#server/modules/admin';
import { setupApp } from '#server/shared/setup-app';

export const app = setupApp(new Elysia()).use(admin);
