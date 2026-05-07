import { type } from 'arktype';

import { biliUidSchema, pageQuerySchema, passwordSchema, usernameSchema } from './common';

/**
 * 管理员角色 Schema
 */
export const adminRoleSchema = type('"admin" | "superAdmin"').describe('管理员角色');

export type AdminRole = typeof adminRoleSchema.infer;

/**
 * 管理员 ID Params Schema
 */
export const adminIdParamsSchema = type({
  id: type('string').describe('管理员 ID'),
});

/**
 * 创建管理员请求参数 Schema
 */
export const adminCreateSchema = type({
  uid: biliUidSchema,
  username: usernameSchema,
  password: passwordSchema,
  'remark?': type('string <= 500').describe('备注'),
});

export type AdminCreateBody = typeof adminCreateSchema.infer;

/**
 * 更新管理员请求参数 Schema
 */
export const superAdminUpdateSchema = type({
  'username?': usernameSchema,
  'remark?': type('string <= 500').describe('备注'),
});

export type SuperAdminUpdateBody = typeof superAdminUpdateSchema.infer;

/**
 * 更新管理员请求参数 Schema
 */
export const adminUpdateSchema = type({
  'username?': usernameSchema,
});

export type AdminUpdateBody = typeof adminUpdateSchema.infer;

/**
 * 管理员分页查询 Schema
 */
export const adminPageQuerySchema = pageQuerySchema;

export type AdminPageQuery = typeof adminPageQuerySchema.infer;

/**
 * 管理员登录请求参数 Schema
 */
export const adminLoginSchema = type({
  uid: biliUidSchema,
  password: passwordSchema,
});

export type AdminLoginBody = typeof adminLoginSchema.infer;
