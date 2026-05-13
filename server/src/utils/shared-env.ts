import path from 'node:path';

import { createEnv } from '@t3-oss/env-core';
import * as v from 'valibot';

export const sharedEnv = createEnv({
  server: {
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
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export type SharedEnv = typeof sharedEnv;
