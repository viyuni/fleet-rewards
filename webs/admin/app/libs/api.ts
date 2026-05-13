import { treaty } from '@elysia/eden';
import type { AdminApp } from '@server/app';

const serverBaseUrl = import.meta.env.VITE_SERVER_BASE_URL;

if (!serverBaseUrl) {
  throw new Error('VITE_SERVER_BASE_URL is required to create the Eden client.');
}

export const api = treaty<AdminApp>(serverBaseUrl, {
  throwHttpError: true,
  fetch: {
    credentials: 'include',
  },
});
