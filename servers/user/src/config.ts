import { sharedConfigShape } from '@gr/server-shared/config';
import arkenv, { type } from 'arkenv';

export const config = arkenv({
  ...sharedConfigShape,
  /**
   * 用户服务端口
   */
  SERVER_PORT: type('number.port').default(3002),

  /**
   * 用户数据密钥
   */
  DATA_SECRET: type('string').optional(),

  /**
   * 用户 JWT 密钥
   */
  JWT_SECRET: type('string'),
});
