import path from 'node:path';

import arkenv, { type } from 'arkenv';

export const config = arkenv({
  /**
   * 管理员服务端口
   */
  ADMIN_SERVER_PORT: type('number').default(3001),

  /**
   * 用户服务端口
   */
  USER_SERVER_PORT: type('number').default(3002),

  /**
   * 管理员数据密钥
   */
  ADMIN_DATA_SECRET: type('string').optional(),

  /**
   * 用户数据密钥
   */
  USER_DATA_SECRET: type('string').optional(),

  /**
   * 管理员 JWT 密钥
   */
  ADMIN_JWT_SECRET: type('string'),

  /**
   * 用户 JWT 密钥
   */
  USER_JWT_SECRET: type('string'),

  /**
   * 数据库 URL
   */
  DATABASE_URL: type('string').optional(),

  /**
   * "development" | "production"
   */
  NODE_ENV: type('"development" | "production"').default('development'),

  /**
   * 日志等级
   */
  LOG_LEVEL: type('"debug" | "info" | "warn" | "error"').default('info'),

  /**
   * 存储图片的路径
   */
  IMAGE_SAVE_PATH: type('string').default(path.join(process.cwd(), 'public', 'images')),
});
