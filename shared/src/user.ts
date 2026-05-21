import * as v from '.';

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
  biliUid: v.bilibiliUid,
  username: v.username,
  password: v.password,
  email: v.optional(
    v.emptyable(v.pipe(v.string(), v.email('请输入有效的邮箱地址'), v.description('邮箱地址'))),
  ),
  address: v.optional(v.emptyable(v.pipe(v.string('请输入收获地址'), v.description('收获地址')))),
  phone: v.optional(v.emptyable(v.pipe(v.string('请输入手机号码'), v.description('手机号码')))),
});

export type UserRegisterBody = v.InferOutput<typeof UserRegisterSchema>;

/**
 * 用户更新 Schema
 */
export const UserUpdateSchema = v.object({
  username: v.optional(v.username),
  email: v.optional(
    v.emptyable(v.pipe(v.string(), v.email('请输入有效的邮箱地址'), v.description('邮箱地址'))),
  ),
  address: v.optional(v.emptyable(v.pipe(v.string('请输入收获地址'), v.description('收获地址')))),
  phone: v.optional(v.emptyable(v.pipe(v.string('请输入手机号码'), v.description('手机号码')))),
});

export type UpdateUserBody = v.InferOutput<typeof UserUpdateSchema>;

/**
 * 用户更新密码 Schema
 */
export const UserUpdatePasswordSchema = v.object({
  biliUid: v.username,
  oldPassword: v.password,
  newPassword: v.password,
});

export type UpdateUserPasswordBody = v.InferOutput<typeof UserUpdatePasswordSchema>;

/**
 * 用户登录 Schema
 */
export const UserLoginSchema = v.object({
  biliUid: v.bilibiliUid,
  password: v.password,
});

export type UserLoginBody = v.InferOutput<typeof UserLoginSchema>;

/**
 * 用户分页查询 Schema
 */
export const UserPageQuerySchema = v.intersect([
  v.pageQuery,
  v.object({
    keyword: v.optional(v.emptyable(v.pipe(v.string('请输入用户名'), v.description('用户名')))),
    status: v.optional(v.picklist(['active', 'banned'], '请选择有效的状态')),
  }),
]);

export type UserPageQuery = v.InferOutput<typeof UserPageQuerySchema>;
