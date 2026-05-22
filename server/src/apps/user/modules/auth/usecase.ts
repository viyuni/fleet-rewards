import type { UserLoginBody, UserRegisterBody } from '@internal/shared/user';

import type { AuthUseCase as SharedAuthUseCase } from '#modules/auth';
import type { RewardUseCase } from '#modules/reward';
import type { UserUseCase } from '#modules/user';
import { InvalidCredentialsError } from '#utils';
import { PasswordUtil } from '#utils';

export class AuthUseCase {
  constructor(
    private readonly deps: {
      authUseCase: SharedAuthUseCase;
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

    const tokens = await this.deps.authUseCase.signTokenPair({
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
}
