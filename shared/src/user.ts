import * as v from 'valibot';

import { BiliUidSchema, PageQuerySchema, PasswordSchema, UsernameSchema } from './common';

/**
 * User ID Params Schema。
 */
export const UserIdParamsSchema = v.object({
  userId: v.pipe(v.string('请输入用户 ID'), v.description('用户 ID')),
});

export type UserIdParams = v.InferOutput<typeof UserIdParamsSchema>;

/**
 * 用户注册 Schema
 */
export const UserRegisterSchema = v.object({
  biliUid: BiliUidSchema,
  username: UsernameSchema,
  password: PasswordSchema,
  email: v.optional(
    v.pipe(v.string('请输入邮箱'), v.email('请输入有效的邮箱地址'), v.description('邮箱')),
  ),
  address: v.optional(v.pipe(v.string('请输入收获地址'), v.description('收获地址'))),
  phone: v.optional(v.pipe(v.string('请输入手机号码'), v.description('手机号码'))),
});

export type UserRegisterBody = v.InferOutput<typeof UserRegisterSchema>;

/**
 * 用户更新 Schema
 */
export const UserUpdateSchema = v.object({
  username: v.optional(UsernameSchema),
  email: v.optional(
    v.pipe(v.string('请输入邮箱'), v.email('请输入有效的邮箱地址'), v.description('邮箱')),
  ),
  address: v.optional(v.pipe(v.string('请输入收获地址'), v.description('收获地址'))),
  phone: v.optional(v.pipe(v.string('请输入手机号码'), v.description('手机号码'))),
});

export type UpdateUserBody = v.InferOutput<typeof UserUpdateSchema>;

/**
 * 用户更新密码 Schema
 */
export const UserUpdatePasswordSchema = v.object({
  biliUid: BiliUidSchema,
  oldPassword: PasswordSchema,
  newPassword: PasswordSchema,
});

export type UpdateUserPasswordBody = v.InferOutput<typeof UserUpdatePasswordSchema>;

/**
 * 用户登录 Schema
 */
export const UserLoginSchema = v.object({
  biliUid: BiliUidSchema,
  password: PasswordSchema,
});

export type UserLoginBody = v.InferOutput<typeof UserLoginSchema>;

/**
 * 用户分页查询 Schema
 */
export const UserPageQuerySchema = v.intersect([
  PageQuerySchema,
  v.object({
    keyword: v.optional(v.pipe(v.string('请输入用户名'), v.description('用户名'))),
    status: v.optional(v.picklist(['normal', 'banned'], '请选择有效的状态')),
  }),
]);

export type UserPageQuery = v.InferOutput<typeof UserPageQuerySchema>;
