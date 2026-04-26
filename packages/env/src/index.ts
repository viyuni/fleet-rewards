import arkenv from 'arkenv';

export const env = arkenv({
  LOG_LEVEL: "'debug' | 'info' | 'warn' | 'error' = 'info'",
  PORT: 'number = 3000',
  DATABASE_URL: 'string',
});
