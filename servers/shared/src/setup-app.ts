import { openapi } from '@elysia/openapi';
import { ValidationError, type Elysia } from 'elysia';

import { BaseErrors } from './errors';

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

export function setupApp<T extends Elysia>(app: T, documentationInfo?: InfoObject) {
  return app
    .use(
      openapi({
        documentation: {
          info: documentationInfo,
          components: {
            securitySchemes: {
              requiredAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: '输入 JWT Token',
              },
            },
          },
          tags: [
            { name: 'Health', description: '健康检查' },
            { name: 'Auth', description: '认证相关' },
            { name: 'Point', description: '积分系统' },
            { name: 'PointType', description: '积分系统' },
            { name: 'Order', description: '订单系统' },
            { name: 'User', description: '用户系统' },
            { name: 'Admin', description: '管理员系统' },
            { name: 'Image', description: '图片系统' },
            { name: 'Product', description: '商品系统' },
          ],
        },
      }),
    )
    .error(BaseErrors)
    .onError(({ error, status }) => {
      if (error instanceof ValidationError) {
        return status(422, {
          code: 'REQUEST_VALIDATION_ERROR',
          message: error.valueError?.message ?? '参数错误',
          details: error.all.map(({ value: _value, message: _message, ...rest }) => rest),
        });
      }
    });
}
