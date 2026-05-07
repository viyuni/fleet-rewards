import { type } from 'arktype';

/**
 * 用户名 Schema
 */
export const usernameSchema = type('3 <= string <= 32 & /^[A-Za-z0-9_-]+$/').describe('用户名');

/**
 * B站用户 UID Schema
 */
export const biliUidSchema = type('4 <= string <= 32 & /^[0-9]+$/').describe('B站用户 UID');

/**
 * 密码 Schema
 */
export const passwordSchema = type('/^(?=.*[A-Za-z])(?=.*\\d).{8,32}$/').describe('密码');

/**
 * 路由参数 ID Schema
 */
export const idParamSchema = type({
  id: type('string').describe('ID'),
});

/**
 * 分页查询参数 Schema
 */
export const pageQuerySchema = type({
  'page?': type('number.integer >= 1').describe('页码'),
  'pageSize?': type('1 <= number.integer <= 50').describe('每页数量'),
});

export type PageQuery = typeof pageQuerySchema.infer;

/**
 * 日期范围参数 Schema
 *
 * 时间戳单位：毫秒
 */
export const dateRangeQuerySchema = type({
  'startTime?': type('number.integer').describe('开始时间戳'),
  'endTime?': type('number.integer').describe('结束时间戳'),
});

export type DateRangeQuery = typeof dateRangeQuerySchema.infer;

/**
 * 搜索关键词 Schema
 *
 * Rule:
 * - 搜索关键词不能为空
 * - 搜索关键词长度不能超过 50 个字符
 */
export const keywordQuerySchema = type({
  'keyword?': type('1 <= string <= 50').describe('搜索关键词'),
});

export type KeywordQuery = typeof keywordQuerySchema.infer;

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
export const nonceBodySchema = type({
  nonce: type('string.uuid').describe('请求唯一随机值'),
});

/**
 * 通用备注 Schema。
 */
export const remarkSchema = type('string <= 100').describe('备注');

/**
 * 可选备注 Body 参数 Schema。
 */
export const remarkBodySchema = type({
  'remark?': remarkSchema,
});

export type RemarkBody = typeof remarkBodySchema.infer;

/**
 * 参数错误信息 Schema
 */
export const paramErrorResponseSchema = type({
  message: 'string',
  errors: type({
    summary: 'string',
    path: 'string',
  }),
});
