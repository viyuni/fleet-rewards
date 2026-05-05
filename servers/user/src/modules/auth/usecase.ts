import type { UserLoginInput, UserRegisterInput } from '@internal/shared';
import type { DbClient } from '@server/db';
import type { JwtAuthenticator } from '@server/shared/auth';

export class AuthUseCase {
  constructor(
    private db: DbClient,
    private authenticator: JwtAuthenticator,
  ) {}

  login(_input: UserLoginInput) {}

  register(_input: UserRegisterInput) {}
}
