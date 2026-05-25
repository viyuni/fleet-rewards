import * as v from '@internal/shared';
import { createEnv } from '@t3-oss/env-core';

import { imageEnv } from '#env/image';
import { sharedEnv } from '#env/shared';

export const userEnv = createEnv({
  extends: [sharedEnv, imageEnv],
  server: {
    /**
     * 用户服务端口
     */
    USER_PORT: v.optional(v.port(), 3600),

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
