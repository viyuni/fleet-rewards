import { createEnv } from '@t3-oss/env-core';
import * as v from 'valibot';

import { port } from '#shared/common';
import { sharedEnv } from '#utils';

export const userEnv = createEnv({
  extends: [sharedEnv],
  server: {
    /**
     * 用户服务端口
     */
    USER_PORT: port(3800),

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
