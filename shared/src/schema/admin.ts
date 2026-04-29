import { type } from 'arktype';

import { biliUidSchema, passwordSchema, usernameSchema } from './common';

const adminRemarkSchema = type('string.trim').to('string <= 500');

export const adminRegisterSchema = type({
  biliUid: biliUidSchema,
  username: usernameSchema,
  password: passwordSchema,
  'remark?': adminRemarkSchema.or('null'),
});

export const adminLoginSchema = type({
  biliUid: biliUidSchema,
  password: 'string',
});

export type AdminRegisterInput = typeof adminRegisterSchema.infer;
export type AdminLoginInput = typeof adminLoginSchema.infer;
