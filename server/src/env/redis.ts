import { createEnv } from '@t3-oss/env-core';
import * as v from 'valibot';

const numberish = () => v.pipe(v.union([v.string(), v.number()]), v.transform(Number));

export const redisEnv = createEnv({
  server: {
    /**
     * Redis URL
     */
    REDIS_URL: v.optional(v.string(), 'redis://localhost:6379'),

    /**
     * Redis 连接超时时间（毫秒）
     */
    REDIS_CONNECTION_TIMEOUT_MS: v.optional(numberish(), 5000),

    /**
     * Redis 空闲超时时间（毫秒）
     */
    REDIS_IDLE_TIMEOUT_MS: v.optional(numberish(), 30000),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export type RedisEnv = typeof redisEnv;
