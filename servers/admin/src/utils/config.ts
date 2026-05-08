import { sharedConfigShape } from '@server/shared/config';
import { PasswordUtil } from '@server/shared/utils';
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

  /**
   * 超级管理员默认 UID
   */
  SUPER_ADMIN_UID: type('4 <= string <= 32 & /^[0-9]+$/').default('0721'),

  /**
   * 超级管理员默认密码
   */
  SUPER_ADMIN_PASSWORD: type('/^(?=.*[A-Za-z])(?=.*\\d).{8,32}$/').default(PasswordUtil.generate()),

  /**
   * 超级管理员默认用户名
   */
  SUPER_ADMIN_USERNAME: type('string').default('Admin'),
});
