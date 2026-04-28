import { Elysia } from 'elysia';

import { db } from '#server/db';
import { createUserAuthPlugin } from '#server/modules/user-auth/presentation/user-auth.plugin';
import { setupApp } from '#server/shared/setup-app';

export const app = setupApp(new Elysia()).use(createUserAuthPlugin(db));
