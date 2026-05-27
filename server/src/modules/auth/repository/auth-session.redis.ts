import { nanoid } from 'nanoid';

import type { RedisClient } from '#redis';

import { REFRESH_TOKEN_EXPIRES_IN_SECONDS } from '../constants';
import type { AuthRole, AuthSession } from '../domain';

const RELEASE_LOCK_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
end
return 0
`;

export class AuthSessionRedisRepository {
  constructor(
    private readonly redis: RedisClient,
    private readonly ttlSeconds = REFRESH_TOKEN_EXPIRES_IN_SECONDS,
  ) {}

  private key(role: AuthRole, sessionId: string) {
    return `auth:session:${role}:${sessionId}`;
  }

  private refreshLockKey(role: AuthRole, sessionId: string) {
    return `auth:refresh:lock:${role}:${sessionId}`;
  }

  private refreshResultKey(role: AuthRole, sessionId: string) {
    return `auth:refresh:result:${role}:${sessionId}`;
  }

  async create(accountId: string, role: AuthRole) {
    const sessionId = nanoid();
    const session: AuthSession = {
      accountId,
      role,
      sessionId,
      createdAt: new Date().toISOString(),
    };

    await this.redis.set(this.key(role, sessionId), JSON.stringify(session), {
      expiration: {
        type: 'EX',
        value: this.ttlSeconds,
      },
    });

    return session;
  }

  async find(role: AuthRole, sessionId: string) {
    const raw = await this.redis.get(this.key(role, sessionId));

    if (!raw) return null;

    return JSON.parse(raw) as AuthSession;
  }

  async exists(role: AuthRole, sessionId: string) {
    return (await this.redis.exists(this.key(role, sessionId))) > 0;
  }

  async delete(role: AuthRole, sessionId: string) {
    await this.redis.del(this.key(role, sessionId));
  }

  async acquireRefreshLock(role: AuthRole, sessionId: string, lockValue: string, ttlMs: number) {
    return (
      (await this.redis.set(this.refreshLockKey(role, sessionId), lockValue, {
        expiration: {
          type: 'PX',
          value: ttlMs,
        },
        condition: 'NX',
      })) === 'OK'
    );
  }

  async releaseRefreshLock(role: AuthRole, sessionId: string, lockValue: string) {
    await this.redis.eval(RELEASE_LOCK_SCRIPT, {
      keys: [this.refreshLockKey(role, sessionId)],
      arguments: [lockValue],
    });
  }

  async getRefreshResult(role: AuthRole, sessionId: string) {
    return this.redis.get(this.refreshResultKey(role, sessionId));
  }

  async saveRefreshResult(role: AuthRole, sessionId: string, accessToken: string, ttlSeconds = 5) {
    await this.redis.set(this.refreshResultKey(role, sessionId), accessToken, {
      expiration: {
        type: 'EX',
        value: ttlSeconds,
      },
    });
  }
}
