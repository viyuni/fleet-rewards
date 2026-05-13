import { treaty } from '@elysia/eden';
import type { App } from '@server/admin';
import ky from 'ky';

if (!import.meta.env.VITE_SERVER_BASE_URL)
  throw new Error('VITE_SERVER_BASE_URL is required to create a treaty.');

const client = ky.create({
  credentials: 'include',
  hooks: {
    beforeRequest: [],
  },
});

export const api = treaty<App>(import.meta.env.VITE_SERVER_BASE_URL, {
  throwHttpError: true,
  parseDate: false,
  fetcher: client as unknown as typeof fetch,
});
