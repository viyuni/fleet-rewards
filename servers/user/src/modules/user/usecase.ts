import type { UserLoginBody, UserRegisterBody } from '@internal/shared/user';
import type { DbClient } from '@server/db';
import type { AuthUseCase } from '@server/shared/auth';

export class UserUseCase {
  constructor(
    private db: DbClient,
    private authUseCase: AuthUseCase,
  ) {}

  login(_input: UserLoginBody) {}

  register(_input: UserRegisterBody) {}
}
