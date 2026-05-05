import { type } from 'arktype';

export const orderIdParamsSchema = type({
  id: type('string').describe('订单ID'),
});

const orderPageSchema = type('number').describe('页码');
const orderPageSizeSchema = type('number').describe('每页数量');
const orderKeywordSchema = type('string').describe('搜索关键词');
const orderUserIdSchema = type('string').describe('用户ID');
const orderProductIdSchema = type('string').describe('商品ID');

const orderRemarkSchema = type('string <= 500').describe('备注');
const orderReasonSchema = type('1 <= string <= 500').describe('原因');

export const orderStatusSchema = type("'pending' | 'completed' | 'refunded'").describe('订单状态');

export const orderPageQuerySchema = type({
  page: orderPageSchema.optional(),
  pageSize: orderPageSizeSchema.optional(),
  keyword: orderKeywordSchema.optional(),
  status: orderStatusSchema.optional(),
  userId: orderUserIdSchema.optional(),
  startTime: type('number').describe('开始时间'),
  endTime: type('number').describe('结束时间'),
});

export const createOrderSchema = type({
  productId: orderProductIdSchema,
  userRemark: orderRemarkSchema.optional(),
  requestId: type('string.uuid').describe('请求 ID'),
});

export const refundOrderSchema = type({
  refundReason: orderReasonSchema,
});

export type OrderPageQuery = typeof orderPageQuerySchema.infer;
export type CreateOrderInput = typeof createOrderSchema.infer;
export type RefundOrderInput = typeof refundOrderSchema.infer;
