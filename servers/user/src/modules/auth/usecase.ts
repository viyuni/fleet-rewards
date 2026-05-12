import type { UserLoginBody, UserRegisterBody } from '@internal/shared/user';
import type { AuthUseCase as SharedAuthUseCase } from '@server/shared/auth';
import { InvalidCredentialsError } from '@server/shared/errors';
import type { UserUseCase } from '@server/shared/user';
import { PasswordUtil } from '@server/shared/utils';

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
