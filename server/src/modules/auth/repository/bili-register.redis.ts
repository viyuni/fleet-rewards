import type { RedisClient } from '#redis';

import type { BiliRegisterChallenge } from '../domain';
import consumeMatchedBiliRegisterScript from './consume-matched-bili-register.lua' with { type: 'text' };

export class BiliRegisterRedisRepository {
  constructor(
    private readonly redis: RedisClient,
    private readonly ttlSeconds: number,
  ) {}

  private key(code: string) {
    return `bili-register:user:code:${code}`;
  }

  async create(challenge: BiliRegisterChallenge) {
    const result = await this.redis.set(this.key(challenge.code), JSON.stringify(challenge), {
      expiration: {
        type: 'EX',
        value: this.ttlSeconds,
      },
      condition: 'NX',
    });

    return result === 'OK';
  }

  async find(code: string) {
    const raw = await this.redis.get(this.key(code));

    if (!raw) return null;

    return JSON.parse(raw) as BiliRegisterChallenge;
  }

  async save(challenge: BiliRegisterChallenge) {
    const ttl = await this.redis.ttl(this.key(challenge.code));

    if (ttl <= 0) {
      return false;
    }

    await this.redis.set(this.key(challenge.code), JSON.stringify(challenge), {
      expiration: {
        type: 'EX',
        value: ttl,
      },
    });

    return true;
  }

  async consume(code: string) {
    const challenge = await this.find(code);

    if (!challenge) return null;

    const consumed: BiliRegisterChallenge = {
      ...challenge,
      status: 'consumed',
      consumedAt: new Date().toISOString(),
    };

    await this.save(consumed);

    return consumed;
  }

  async consumeMatched(code: string, verifierHash: string) {
    const raw = await this.redis.eval(consumeMatchedBiliRegisterScript, {
      keys: [this.key(code)],
      arguments: [verifierHash, new Date().toISOString()],
    });

    if (!raw || typeof raw !== 'string') return null;

    return JSON.parse(raw) as BiliRegisterChallenge;
  }
}
