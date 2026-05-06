import type { UserLoginBody, UserRegisterBody } from '@internal/shared';
import type { DbClient } from '@server/db';
import type { AuthUseCase as SharedAuthUseCase } from '@server/shared/auth';

export class AuthUseCase {
  constructor(
    private db: DbClient,
    private authUseCase: SharedAuthUseCase,
  ) {}

  login(_input: UserLoginBody) {}

  register(_input: UserRegisterBody) {}
}
