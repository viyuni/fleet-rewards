import type { CookieOptions } from 'elysia';

export const ACCESS_TOKEN_COOKIE_NAME = 'accessToken';
export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';
export const AUTH_COOKIE_NAME = ACCESS_TOKEN_COOKIE_NAME;

export const ACCESS_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 15,
} satisfies CookieOptions;

export const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
} satisfies CookieOptions;

export const AUTH_COOKIE_OPTIONS = ACCESS_TOKEN_COOKIE_OPTIONS;
