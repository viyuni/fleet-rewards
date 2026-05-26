import type { UserLoginBody, UserRegisterBody } from '@internal/shared/user';

import type { AuthUseCase as SharedAuthUseCase } from '#modules/auth';
import type { BiliLoginUseCase } from '#modules/auth';
import type { RewardUseCase } from '#modules/reward';
import type { UserUseCase } from '#modules/user';
import { InvalidCredentialsError } from '#utils';
import { PasswordUtil } from '#utils';

export class AuthUseCase {
  constructor(
    private readonly deps: {
      authUseCase: SharedAuthUseCase;
      biliLoginUseCase?: BiliLoginUseCase;
      rewardUseCase: RewardUseCase;
      userUseCase: UserUseCase;
    },
  ) {}

  async login(input: UserLoginBody) {
    const user = await this.deps.userUseCase.getAvailableByBiliUid(input.biliUid);

    const isValidPassword = await PasswordUtil.verify(input.password, user.passwordHash);

    if (!isValidPassword) {
      throw new InvalidCredentialsError();
    }

    const tokens = await this.deps.authUseCase.createSessionTokenPair({
      id: user.id,
      role: 'user',
    });

    return {
      user: {
        id: user.id,
        biliUid: user.biliUid,
        username: user.username,
        status: user.status,
      },
      ...tokens,
    };
  }

  async register(input: UserRegisterBody) {
    const user = await this.deps.userUseCase.create(input);

    await this.deps.rewardUseCase.replayRewardBiliGuardByUserId(user.id);

    return user;
  }

  async createBiliLoginCode() {
    const biliLoginUseCase = this.biliLoginUseCase;
    const { challenge, verifier } = await biliLoginUseCase.createChallenge();

    return {
      code: challenge.code,
      expiresAt: challenge.expiresAt,
      verifier,
    };
  }

  async getBiliLoginCodeStatus(code: string, verifier: string | undefined) {
    const challenge = await this.biliLoginUseCase.getOwnedChallenge(code, verifier);

    if (!challenge || challenge.status === 'consumed') {
      return {
        status: 'expired' as const,
      };
    }

    if (challenge.status === 'matched') {
      return {
        status: 'matched' as const,
        code: challenge.code,
        expiresAt: challenge.expiresAt,
        biliUser: {
          uid: challenge.biliUid!,
          name: challenge.biliName,
        },
      };
    }

    return {
      status: 'pending' as const,
      code: challenge.code,
      expiresAt: challenge.expiresAt,
    };
  }

  async confirmBiliLoginCode(code: string, verifier: string | undefined) {
    const ownedChallenge = await this.biliLoginUseCase.getOwnedChallenge(code, verifier);

    if (!ownedChallenge || ownedChallenge.status === 'consumed') {
      return {
        status: 'expired',
      };
    }

    if (ownedChallenge.status !== 'matched') {
      return {
        status: 'pending',
      };
    }

    const challenge = await this.biliLoginUseCase.consumeChallenge(code, verifier);

    if (!challenge?.biliUid) {
      return {
        status: 'expired',
      };
    }

    const user = await this.deps.userUseCase.getAvailableByBiliUid(challenge.biliUid);

    const tokens = await this.deps.authUseCase.createSessionTokenPair({
      id: user.id,
      role: 'user',
    });

    return {
      status: 'authenticated',
      user: {
        id: user.id,
        biliUid: user.biliUid,
        username: user.username,
        status: user.status,
      },
      ...tokens,
    };
  }

  private get biliLoginUseCase() {
    if (!this.deps.biliLoginUseCase) {
      throw new Error('Bilibili login use case is not configured');
    }

    return this.deps.biliLoginUseCase;
  }
}
