import { type } from 'arktype';

import { biliUidSchema, passwordSchema, usernameSchema } from './common';

export const userRegisterSchema = type({
  biliUid: biliUidSchema,
  username: usernameSchema,
  password: passwordSchema,
  email: 'string.email?',
  address: 'string?',
  phone: 'string?',
});

export const userLoginSchema = type({
  biliUid: biliUidSchema,
  password: 'string',
});

export type UserRegisterInput = typeof userRegisterSchema.infer;
export type UserLoginInput = typeof userLoginSchema.infer;
