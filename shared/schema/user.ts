import { type } from 'arktype';

import { biliUidSchema, pageQuerySchema, passwordSchema, usernameSchema } from './common';

/**
 * User ID Params Schema。
 */
export const userIdParamsSchema = type({
  id: type('string').describe('用户 ID'),
});

export type UserIdParams = typeof userIdParamsSchema.infer;

/**
 * 用户注册 Schema
 */
export const userRegisterSchema = type({
  biliUid: biliUidSchema,
  username: usernameSchema,
  password: passwordSchema,
  'email?': type('string.email').describe('邮箱'),
  'address?': type('string').describe('收获地址'),
  'phone?': type('string').describe('手机号码'),
});

export type UserRegisterBody = typeof userRegisterSchema.infer;

/**
 * 用户更新 Schema
 */
export const userUpdateSchema = type({
  'username?': usernameSchema,
  'email?': type('string.email').describe('邮箱'),
  'address?': type('string').describe('收获地址'),
  'phone?': type('string').describe('手机号码'),
});

export type UpdateUserBody = typeof userUpdateSchema.infer;

/**
 * 用户更新密码 Schema
 */
export const userUpdatePasswordSchema = type({
  biliUid: biliUidSchema,
  oldPassword: passwordSchema,
  newPassword: passwordSchema,
});

export type UpdateUserPasswordBody = typeof userUpdatePasswordSchema.infer;

/**
 * 用户登录 Schema
 */
export const userLoginSchema = type({
  biliUid: biliUidSchema,
  password: passwordSchema,
});

export type UserLoginBody = typeof userLoginSchema.infer;

/**
 * 用户分页查询 Schema
 */
export const userPageQuerySchema = pageQuerySchema.and({
  'keyword?': type('string').describe('用户名'),
  'status?': type('"normal" | "banned"').describe('状态'),
});

export type UserPageQuery = typeof userPageQuerySchema.infer;
