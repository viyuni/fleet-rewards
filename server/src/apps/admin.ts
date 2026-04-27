import { Elysia } from 'elysia';

import { setupApp } from '#server/shared/setup-app';

export const app = setupApp(new Elysia());
