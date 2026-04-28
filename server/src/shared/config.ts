import arkenv, { type } from 'arkenv';

export const config = arkenv({
  ADMIN_SERVER_PORT: type('number').default(3001),
  USER_SERVER_PORT: type('number').default(3002),

  ADMIN_DATA_SECRET: type('string').optional(),
  USER_DATA_SECRET: type('string').optional(),

  ADMIN_JWT_SECRET: type('string'),
  USER_JWT_SECRET: type('string'),

  DATABASE_URL: type('string').optional(),
  NODE_ENV: type('"development" | "production"').default('development'),
  LOG_LEVEL: type('"debug" | "info" | "warn" | "error"').default('info'),
});
