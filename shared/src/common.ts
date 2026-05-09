import * as v from 'valibot';

/**
 * 用户名 Schema
 */
export const UsernameSchema = v.pipe(
  v.string('请输入用户名'),
  v.minLength(3, '用户名不能少于 3 个字符'),
  v.maxLength(32, '用户名不能超过 32 个字符'),
  v.regex(/^[A-Za-z0-9_-]+$/, '用户名只能包含字母、数字、下划线和连字符'),
  v.description('用户名'),
);

/**
 * UID Schema
 */
export const BiliUidSchema = v.pipe(
  v.string('请输入 UID'),
  v.minLength(4, 'UID 不能少于 4 个字符'),
  v.maxLength(32, 'UID 不能超过 32 个字符'),
  v.regex(/^[0-9]+$/, 'UID 只能包含数字'),
  v.description('UID'),
);

/**
 * 密码 Schema
 */
export const PasswordSchema = v.pipe(
  v.string('请输入密码'),
  v.regex(/^(?=.*[A-Za-z])(?=.*\d).{12,32}$/, '密码长度需为 12 到 32 个字符，且包含字母和数字'),
  v.description('密码'),
);

/**
 * 路由参数 ID Schema
 */
export const IdParamSchema = v.object({
  id: v.pipe(v.string('请输入 ID'), v.description('ID')),
});

/**
 * 分页查询参数 Schema
 */
export const PageQuerySchema = v.object({
  page: v.optional(
    v.pipe(
      v.string('请输入页码'),
      v.toNumber('页码必须是数字'),
      v.integer('页码必须是整数'),
      v.minValue(1, '页码不能小于 1'),
      v.description('页码'),
    ),
  ),
  pageSize: v.optional(
    v.pipe(
      v.string('请输入每页数量'),
      v.toNumber('每页数量必须是数字'),
      v.integer('每页数量必须是整数'),
      v.minValue(1, '每页数量不能小于 1'),
      v.maxValue(50, '每页数量不能超过 50'),
      v.description('每页数量'),
    ),
  ),
});

export type PageQuery = v.InferOutput<typeof PageQuerySchema>;

/**
 * 日期范围参数 Schema
 *
 * 时间戳单位：毫秒
 */
export const DateRangeQuerySchema = v.object({
  startTime: v.optional(
    v.pipe(
      v.string('请输入开始时间戳'),
      v.toNumber('开始时间戳必须是数字'),
      v.integer('开始时间戳必须是整数'),
      v.description('开始时间戳'),
    ),
  ),
  endTime: v.optional(
    v.pipe(
      v.string('请输入结束时间戳'),
      v.toNumber('结束时间戳必须是数字'),
      v.integer('结束时间戳必须是整数'),
      v.description('结束时间戳'),
    ),
  ),
});

export type DateRangeQuery = v.InferOutput<typeof DateRangeQuerySchema>;

/**
 * 搜索关键词 Schema
 *
 * Rule:
 * - 搜索关键词不能为空
 * - 搜索关键词长度不能超过 50 个字符
 */
export const KeywordQuerySchema = v.object({
  keyword: v.optional(
    v.pipe(
      v.string('请输入搜索关键词'),
      v.minLength(1, '搜索关键词不能为空'),
      v.maxLength(50, '搜索关键词不能超过 50 个字符'),
      v.description('搜索关键词'),
    ),
  ),
});

export type KeywordQuery = v.InferOutput<typeof KeywordQuerySchema>;

/**
 * 请求唯一随机值 Body 参数 Schema。
 *
 * 用于由客户端为一次操作生成唯一随机值，服务端可结合业务场景、
 * 用户 ID 等信息生成最终的幂等键，避免重复提交导致重复执行业务。
 *
 * 规则：
 * - `nonce` 为必填参数
 * - 必须是合法 UUID 字符串
 * - 同一业务场景下，相同 `nonce` 应被视为同一次请求
 */
export const NonceBodySchema = v.object({
  nonce: v.pipe(
    v.string('请输入请求唯一随机值'),
    v.uuid('请求唯一随机值必须是合法 UUID'),
    v.description('请求唯一随机值'),
  ),
});

/**
 * 通用备注 Schema。
 */
export const RemarkSchema = v.pipe(
  v.string('请输入备注'),
  v.maxLength(100, '备注不能超过 100 个字符'),
  v.description('备注'),
);

/**
 * 可选备注 Body 参数 Schema。
 */
export const RemarkBodySchema = v.object({
  remark: v.optional(RemarkSchema),
});

export type RemarkBody = v.InferOutput<typeof RemarkBodySchema>;

/**
 * 参数错误信息 Schema
 */
export const ParamErrorResponseSchema = v.object({
  code: v.pipe(v.string('请输入错误码'), v.description('错误码')),
  message: v.pipe(v.string('请输入错误消息'), v.description('错误消息')),
  details: v.array(v.string()),
});

export type ParamErrorResponse = v.InferOutput<typeof ParamErrorResponseSchema>;
