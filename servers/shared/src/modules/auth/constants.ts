import type { CookieOptions } from 'elysia';

export const AUTH_COOKIE_NAME = 'authorization';

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24,
} satisfies CookieOptions;
