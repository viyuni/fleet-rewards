import { sharedConfigShape } from '@server/shared/config';
import arkenv, { type } from 'arkenv';

export const config = arkenv({
  ...sharedConfigShape,
  /**
   * 管理员服务端口
   */
  PORT: type('number.port').default(3000),

  /**
   * 管理员数据密钥
   */
  DATA_SECRET: type('string').optional(),

  /**
   * 管理员 JWT 密钥
   */
  JWT_SECRET: type('string'),
});
