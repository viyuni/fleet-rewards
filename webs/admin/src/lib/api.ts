import { treaty } from '@elysia/eden';
import type { App } from '@gr/server-admin';

if (!import.meta.env.VITE_SERVER_BASE_URL)
  throw new Error('VITE_SERVER_BASE_URL is required to create a treaty.');

export const api = treaty<App>(import.meta.env.VITE_SERVER_BASE_URL, {
  throwHttpError: true,
  parseDate: false,
  headers: {
    Authorization: 'Bearer $token',
  },
});
