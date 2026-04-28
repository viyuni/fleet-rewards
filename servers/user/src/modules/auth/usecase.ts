import type { DbClient } from '@gr/server-shared/db';
import type { JwtAuthenticator } from '@gr/server-shared/jwt';

import type { UserLoginInput, UserRegisterInput } from '#shared/schema';

export class AuthUseCase {
  constructor(
    private db: DbClient,
    private authenticator: JwtAuthenticator,
  ) {}

  login(_input: UserLoginInput) {}

  register(_input: UserRegisterInput) {}
}
