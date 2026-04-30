import path from 'node:path';

import { type } from 'arkenv';

export const sharedConfigShape = {
  /**
   * 数据库 URL
   */
  DATABASE_URL: type('string'),

  /**
   * "development" | "production"
   */
  NODE_ENV: type('"development" | "production" ').default('development'),

  /**
   * 日志等级
   */
  LOG_LEVEL: type('"debug" | "info" | "warn" | "error"').default('info'),

  /**
   * 存储图片的路径
   */
  IMAGE_SAVE_PATH: type('string').default(path.join(process.cwd(), 'public', 'images')),
};

const sharedConfigSchema = type(sharedConfigShape);

export type SharedConfig = typeof sharedConfigSchema.infer;
