import type { LiveLoginChallenge } from '../domain';

interface RedisLike {
  send(command: string, args: string[]): Promise<unknown>;
  get(key: string): Promise<string | null>;
  ttl(key: string): Promise<number>;
  set(key: string, value: string, ex: 'EX', seconds: number): Promise<'OK'>;
}

export class LiveLoginRedisRepository {
  constructor(
    private readonly redis: RedisLike,
    private readonly ttlSeconds: number,
  ) {}

  private key(code: string) {
    return `live-login:user:code:${code}`;
  }

  async create(challenge: LiveLoginChallenge) {
    const result = await this.redis.send('SET', [
      this.key(challenge.code),
      JSON.stringify(challenge),
      'EX',
      String(this.ttlSeconds),
      'NX',
    ]);

    return result === 'OK';
  }

  async find(code: string) {
    const raw = await this.redis.get(this.key(code));

    if (!raw) return null;

    return JSON.parse(raw) as LiveLoginChallenge;
  }

  async save(challenge: LiveLoginChallenge) {
    const ttl = await this.redis.ttl(this.key(challenge.code));

    if (ttl <= 0) {
      return false;
    }

    await this.redis.set(this.key(challenge.code), JSON.stringify(challenge), 'EX', ttl);

    return true;
  }

  async consume(code: string) {
    const challenge = await this.find(code);

    if (!challenge) return null;

    const consumed: LiveLoginChallenge = {
      ...challenge,
      status: 'consumed',
      consumedAt: new Date().toISOString(),
    };

    await this.save(consumed);

    return consumed;
  }
}
