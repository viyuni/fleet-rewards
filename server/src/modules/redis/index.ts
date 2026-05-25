import { RedisClient } from 'bun';
import type { RedisOptions } from 'bun';

import { redisEnv, type RedisEnv } from '#env/redis';
import { logger } from '#utils/logger';

export function createRedisClient(env: RedisEnv = redisEnv) {
  const options: RedisOptions = {
    connectionTimeout: env.REDIS_CONNECTION_TIMEOUT_MS,
    idleTimeout: env.REDIS_IDLE_TIMEOUT_MS,
    autoReconnect: true,
    maxRetries: env.REDIS_MAX_RETRIES,
  };

  const client = new RedisClient(env.REDIS_URL, options);

  client.onconnect = () => {
    logger.info('Redis connected');
  };

  client.onclose = error => {
    logger.error(error, 'Redis connection closed');
  };

  return client;
}

export const redis = createRedisClient();

export function closeRedis(client: RedisClient = redis) {
  client.close();
}

export async function pingRedis(client: RedisClient = redis) {
  return client.ping('healthcheck');
}
