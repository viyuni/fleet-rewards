import path from 'node:path';

import { createEnv } from '@t3-oss/env-core';
import * as v from 'valibot';

const port = (defaultPort: number) =>
  v.pipe(
    v.optional(v.string(), String(defaultPort)),
    v.transform(Number),
    v.integer(),
    v.minValue(0),
    v.maxValue(65535),
  );

/**
 * Shared env schema shape
 */
export const SharedEnvShape = {
  /**
   * 端口
   */
  PORT: port(3000),

  /**
   * 数据库 URL
   */
  DATABASE_URL: v.string(),

  /**
   * "development" | "production" | "test"
   */
  NODE_ENV: v.optional(v.picklist(['development', 'production', 'test']), 'development'),

  /**
   * 日志等级
   */
  LOG_LEVEL: v.optional(v.picklist(['debug', 'info', 'warn', 'error']), 'info'),

  /**
   * 存储图片的路径
   */
  IMAGE_SAVE_PATH: v.optional(v.string(), path.join(process.cwd(), 'public', 'images')),
};

const schema = v.object(SharedEnvShape);

export type SharedEnv = v.InferOutput<typeof schema>;

export const env = createEnv({
  shared: SharedEnvShape,
  server: {},
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
