import { createEnv } from '@t3-oss/env-core';
import * as v from 'valibot';

import { port } from '#shared/common';
import { PasswordUtil } from '#utils';
import { sharedEnv } from '#utils';

export const adminEnv = createEnv({
  extends: [sharedEnv],
  server: {
    /**
     * 管理员服务端口
     */
    ADMIN_PORT: port(3600),

    /**
     * 数据密钥
     */
    DATA_SECRET: v.string(),

    /**
     * JWT 密钥
     */
    JWT_SECRET: v.string(),

    /**
     * 超级管理员默认 UID
     */
    SUPER_ADMIN_UID: v.optional(
      v.pipe(v.string(), v.minLength(4), v.maxLength(32), v.regex(/^[0-9]+$/)),
      '0721',
    ),

    /**
     * 超级管理员默认密码
     */
    SUPER_ADMIN_PASSWORD: v.optional(
      v.pipe(v.string(), v.regex(/^(?=.*[A-Za-z])(?=.*\d).{8,32}$/)),
      PasswordUtil.generate(),
    ),

    /**
     * 超级管理员默认用户名
     */
    SUPER_ADMIN_USERNAME: v.optional(v.string(), 'Admin'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
