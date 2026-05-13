import type { UserLoginBody, UserRegisterBody } from '@internal/shared/user';

import { InvalidCredentialsError } from '#errors';
import type { AuthUseCase as SharedAuthUseCase } from '#modules/auth';
import type { UserUseCase } from '#modules/user';
import { PasswordUtil } from '#utils';

export class AuthUseCase {
  constructor(
    private readonly deps: { authUseCase: SharedAuthUseCase; userUseCase: UserUseCase },
  ) {}

  async login(input: UserLoginBody) {
    const user = await this.deps.userUseCase.getAvailableByBiliUid(input.biliUid);

    const isValidPassword = await PasswordUtil.verify(input.password, user.passwordHash);

    if (!isValidPassword) {
      throw new InvalidCredentialsError();
    }

    const token = await this.deps.authUseCase.sign({
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
      token,
    };
  }

  register(input: UserRegisterBody) {
    return this.deps.userUseCase.create(input);
  }
}
