import { type } from 'arktype';

export const usernameSchema = type('string.trim').to('3 <= string <= 32').to('/^[A-Za-z0-9_-]+$/');

export const biliUidSchema = type('string.trim').to('1 <= string <= 32').to('/^[0-9]+$/');

export const passwordSchema = type('8 <= string <= 128').narrow(
  (password, context) =>
    (/[A-Za-z]/.test(password) && /[0-9]/.test(password)) || context.mustBe('同时包含字母和数字'),
);
