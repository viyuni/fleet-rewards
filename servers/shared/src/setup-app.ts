import { openapi } from '@elysia/openapi';
import { toOpenApiSchema } from '@internal/shared';
import { type } from 'arktype';
import { ValidationError, type AnyElysia } from 'elysia';

interface ContactObject {
  name?: string;
  url?: string;
  email?: string;
}

interface LicenseObject {
  name: string;
  url?: string;
}

interface InfoObject {
  title: string;
  description?: string;
  termsOfService?: string;
  contact?: ContactObject;
  license?: LicenseObject;
  version: string;
}

export function setupApp<T extends AnyElysia>(app: T, documentationInfo?: InfoObject) {
  return app
    .use(
      openapi({
        mapJsonSchema: {
          arktype: toOpenApiSchema,
        },
        documentation: {
          info: documentationInfo,
          components: {
            securitySchemes: {
              requiredAuth: {
                type: 'apiKey',
                in: 'cookie',
                name: 'auth_token',
                description: 'JWT Cookie，也兼容 Authorization Bearer 和 X-API-Key',
              },
            },
          },
          tags: [
            { name: 'Health', description: '健康检查' },
            { name: 'Auth', description: '认证相关' },
            { name: 'PointType', description: '积分系统' },
            { name: 'PointAccount', description: '积分账户' },
            { name: 'PointTransaction', description: '积分流水' },
            { name: 'Order', description: '订单系统' },
            { name: 'User', description: '用户系统' },
            { name: 'Admin', description: '管理员系统' },
            { name: 'Image', description: '图片系统' },
            { name: 'Product', description: '商品系统' },
          ],
        },
      }),
    )
    .onError(({ error, status, code }) => {
      if (error instanceof ValidationError) {
        return status(422, {
          code: 'REQUEST_VALIDATION_ERROR',
          message: error.valueError?.message ?? '参数错误',
          details: error.all.map(({ value: _value, message: _message, ...rest }) => rest),
        });
      }

      if (code === 500 || code === 'UNKNOWN') {
        return status(500, {
          code: 'INTERNAL_SERVER_ERROR',
          message: '服务器内部错误',
        });
      }
    });
}
