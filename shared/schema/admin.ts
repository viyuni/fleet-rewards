import { type } from 'arktype';

import { biliUidSchema, passwordSchema, usernameSchema } from './common';

/**
 * 管理员 ID Params Schema
 */
export const adminIdParamsSchema = type({
  id: type('string').describe('管理员 ID'),
});

/**
 * 管理员注册请求参数 Schema
 */
export const adminRegisterSchema = type({
  biliUid: biliUidSchema,
  username: usernameSchema,
  password: passwordSchema,
  'remark?': type('string <= 500').describe('备注'),
});

export type AdminRegisterBody = typeof adminRegisterSchema.infer;

/**
 * 管理员登录请求参数 Schema
 */
export const adminLoginSchema = type({
  biliUid: biliUidSchema,
  password: passwordSchema,
});

export type AdminLoginBody = typeof adminLoginSchema.infer;
