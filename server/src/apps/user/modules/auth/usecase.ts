import type { UserLoginBody, UserRegisterBody } from '@internal/shared/user';

import type { AuthUseCase as SharedAuthUseCase } from '#modules/auth';
import type { LiveLoginUseCase } from '#modules/auth';
import type { RewardUseCase } from '#modules/reward';
import type { UserUseCase } from '#modules/user';
import { InvalidCredentialsError } from '#utils';
import { PasswordUtil } from '#utils';

export class AuthUseCase {
  constructor(
    private readonly deps: {
      authUseCase: SharedAuthUseCase;
      liveLoginUseCase?: LiveLoginUseCase;
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

  async createLiveCode() {
    const liveLoginUseCase = this.getLiveLoginUseCase();
    const challenge = await liveLoginUseCase.createChallenge();

    return {
      code: challenge.code,
      expiresAt: challenge.expiresAt,
    };
  }

  async getLiveCodeStatus(code: string) {
    const challenge = await this.getLiveLoginUseCase().getChallenge(code);

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

  async confirmLiveCode(code: string) {
    const challenge = await this.getLiveLoginUseCase().getChallenge(code);

    if (!challenge || challenge.status === 'consumed') {
      return {
        status: 'expired',
      };
    }

    if (challenge.status !== 'matched' || !challenge.biliUid) {
      return {
        status: 'pending',
      };
    }

    const user = await this.deps.userUseCase.getAvailableByBiliUid(challenge.biliUid);

    const tokens = await this.deps.authUseCase.createSessionTokenPair({
      id: user.id,
      role: 'user',
    });

    await this.getLiveLoginUseCase().consumeChallenge(challenge.code);

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

  private getLiveLoginUseCase() {
    if (!this.deps.liveLoginUseCase) {
      throw new Error('Live login use case is not configured');
    }

    return this.deps.liveLoginUseCase;
  }
}
