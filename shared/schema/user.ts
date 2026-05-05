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

export const userIdParamsSchema = type({
  id: type('string').describe('用户ID'),
});

export const userPageQuerySchema = type({
  page: type('number.integer').describe('页码').optional(),
  pageSize: type('number.integer').describe('每页数量').optional(),
  keyword: type('string').describe('用户名').optional(),
  status: type('"normal" | "banned"').describe('状态').optional(),
});

export type UserRegisterInput = typeof userRegisterSchema.infer;
export type UserLoginInput = typeof userLoginSchema.infer;
export type UserPageQuery = typeof userPageQuerySchema.infer;
