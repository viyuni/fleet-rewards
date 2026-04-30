import { type } from 'arktype';

import { biliUidSchema, loginPasswordSchema, passwordSchema, usernameSchema } from './common';

export const userRegisterSchema = type({
  biliUid: biliUidSchema,
  username: usernameSchema,
  password: passwordSchema,
  email: type('string.email').describe('邮箱').optional(),
  address: type('string').describe('收获地址').optional(),
  phone: type('string').describe('手机号码').optional(),
});

export const userLoginSchema = type({
  biliUid: biliUidSchema,
  password: loginPasswordSchema,
});

export type UserRegisterInput = typeof userRegisterSchema.infer;
export type UserLoginInput = typeof userLoginSchema.infer;
