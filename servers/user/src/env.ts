import path from 'node:path';

import { SharedEnvShape } from '@server/shared/env';
import { createEnv } from '@t3-oss/env-core';
import * as v from 'valibot';

export const env = createEnv({
  server: {
    ...SharedEnvShape,

    /**
     * 存储图片的路径
     */
    IMAGE_SAVE_PATH: v.optional(v.string(), path.join(process.cwd(), 'public', 'images')),

    /**
     * 数据密钥
     */
    DATA_SECRET: v.string(),

    /**
     * JWT 密钥
     */
    JWT_SECRET: v.string(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
