import { sharedConfigShape } from '@server/shared/config';
import arkenv, { type } from 'arkenv';

export const config = arkenv({
  ...sharedConfigShape,
  /**
   * 管理员服务端口
   */
  PORT: type('number.port').default(3000),

  /**
   * 数据密钥
   */
  DATA_SECRET: type('string'),

  /**
   * JWT 密钥
   */
  JWT_SECRET: type('string'),
});
