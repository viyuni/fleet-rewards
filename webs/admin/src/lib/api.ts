import { treaty } from '@elysia/eden';
import type { App } from '@fleet-rewards/server/eden-admin';

if (!import.meta.env.SERVER_BASE_URL)
  throw new Error('SERVER_BASE_URL is required to create a treaty.');

export const api = treaty<App>(import.meta.env.SERVER_BASE_URL);
