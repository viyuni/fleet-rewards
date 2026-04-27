import arkenv, { type } from 'arkenv';

export const env = arkenv({
  DATABASE_URL: type('string'),
});
