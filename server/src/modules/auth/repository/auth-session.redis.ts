import { nanoid } from 'nanoid';

import { REFRESH_TOKEN_EXPIRES_IN_SECONDS } from '../constants';
import type { AuthRole, AuthSession } from '../domain';

interface RedisLike {
  set(key: string, value: string, ex: 'EX', seconds: number): Promise<'OK'>;
  get(key: string): Promise<string | null>;
  exists(key: string): Promise<boolean>;
  del(key: string): Promise<number>;
}

export class AuthSessionRedisRepository {
  constructor(
    private readonly redis: RedisLike,
    private readonly ttlSeconds = REFRESH_TOKEN_EXPIRES_IN_SECONDS,
  ) {}

  private key(role: AuthRole, sessionId: string) {
    return `auth:session:${role}:${sessionId}`;
  }

  async create(accountId: string, role: AuthRole) {
    const sessionId = nanoid();
    const session: AuthSession = {
      accountId,
      role,
      sessionId,
      createdAt: new Date().toISOString(),
    };

    await this.redis.set(this.key(role, sessionId), JSON.stringify(session), 'EX', this.ttlSeconds);

    return session;
  }

  async find(role: AuthRole, sessionId: string) {
    const raw = await this.redis.get(this.key(role, sessionId));

    if (!raw) return null;

    return JSON.parse(raw) as AuthSession;
  }

  async exists(role: AuthRole, sessionId: string) {
    return this.redis.exists(this.key(role, sessionId));
  }

  async delete(role: AuthRole, sessionId: string) {
    await this.redis.del(this.key(role, sessionId));
  }
}
