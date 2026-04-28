import { type } from 'arktype';

import { biliUidSchema, passwordSchema, usernameSchema } from './common';

export const userRegisterSchema = type({
  biliUid: biliUidSchema,
  username: usernameSchema,
  password: passwordSchema,
});

export const userLoginSchema = type({
  username: usernameSchema,
  password: 'string',
});

export type UserRegisterInput = typeof userRegisterSchema.infer;
export type UserLoginInput = typeof userLoginSchema.infer;
