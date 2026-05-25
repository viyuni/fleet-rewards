import { customAlphabet } from 'nanoid';

import type { LiveLoginChallenge } from '../domain';
import type { LiveLoginRedisRepository } from '../repository';

const createCodeSuffix = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 6);

export interface LiveLoginMatchInput {
  code: string;
  biliUid: string;
  biliName?: string;
}

export class LiveLoginUseCase {
  constructor(
    private readonly deps: {
      liveLoginRepo: LiveLoginRedisRepository;
      ttlSeconds: number;
    },
  ) {}

  async createChallenge() {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = `U-${createCodeSuffix()}`;
      const now = Date.now();
      const challenge: LiveLoginChallenge = {
        status: 'pending',
        code,
        createdAt: new Date(now).toISOString(),
        expiresAt: new Date(now + this.deps.ttlSeconds * 1000).toISOString(),
      };

      if (await this.deps.liveLoginRepo.create(challenge)) {
        return challenge;
      }
    }

    throw new Error('生成登录码失败，请稍后再试');
  }

  async getChallenge(code: string) {
    return this.deps.liveLoginRepo.find(this.normalizeCode(code));
  }

  async matchMessage(input: LiveLoginMatchInput) {
    const code = this.normalizeCode(input.code);

    if (!code.startsWith('U-')) {
      return null;
    }

    const challenge = await this.deps.liveLoginRepo.find(code);

    if (!challenge || challenge.status !== 'pending') {
      return null;
    }

    const matched: LiveLoginChallenge = {
      ...challenge,
      status: 'matched',
      biliUid: input.biliUid,
      biliName: input.biliName,
      matchedAt: new Date().toISOString(),
    };

    await this.deps.liveLoginRepo.save(matched);

    return matched;
  }

  async consumeChallenge(code: string) {
    return this.deps.liveLoginRepo.consume(this.normalizeCode(code));
  }

  private normalizeCode(code: string) {
    return code.trim().toUpperCase();
  }
}
