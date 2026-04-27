import arkenv, { type } from 'arkenv';

export const env = arkenv({
  ADMIN_SERVER_PORT: type('number').default(3001),
  USER_SERVER_PORT: type('number').default(3002),
  DATABASE_URL: type('string').optional(),
  NODE_ENV: type('"development" | "production"').default('development'),
  LOG_LEVEL: type('"debug" | "info" | "warn" | "error"').default('info'),
});

console.log(env);
