import { type } from 'arktype';

export const usernameSchema = type('string.trim')
  .to('3 <= string <= 32')
  .to('/^[A-Za-z0-9_-]+$/')
  .describe('用户名');

export const biliUidSchema = type('string.trim')
  .to('1 <= string <= 32')
  .to('/^[0-9]+$/')
  .describe('B站用户UID');

export const passwordSchema = type('/^(?=.*[A-Za-z])(?=.*\\d).{8,32}$/').describe('密码');

export const loginPasswordSchema = type('string.trim').to('8 <= string <= 32').describe('登录密码');

export const errorSchema = type({
  summary: 'string',
  path: 'string',
});

export const paramErrorResponseSchema = type({
  message: 'string',
  errors: errorSchema.array(),
});
