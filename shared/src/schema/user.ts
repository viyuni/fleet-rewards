import { type } from 'arktype';

const userUsernameSchema = type('string.trim').to('3 <= string <= 32').to('/^[A-Za-z0-9_-]+$/');

const biliUidSchema = type('string.trim').to('1 <= string <= 32').to('/^[0-9]+$/');

const userPasswordSchema = type('8 <= string <= 128').narrow(
  (password, context) =>
    (/[A-Za-z]/.test(password) && /[0-9]/.test(password)) || context.mustBe('同时包含字母和数字'),
);

export const userRegisterSchema = type({
  biliUid: biliUidSchema,
  username: userUsernameSchema,
  password: userPasswordSchema,
});

export const userLoginSchema = type({
  username: userUsernameSchema,
  password: 'string',
});

export type UserRegisterInput = typeof userRegisterSchema.infer;
export type UserLoginInput = typeof userLoginSchema.infer;
