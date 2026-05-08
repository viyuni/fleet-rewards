import type { AdminLoginBody } from '@internal/shared/schema';
import type { DbExecutor } from '@server/db';
import { InvalidCredentialsError } from '@server/shared';
import type { AuthUseCase } from '@server/shared/auth';

import { AdminRepository } from '#server/admin/modules/admin/repository';

export interface AdminAuthUseCaseDeps {
  db: DbExecutor;
  adminRepo: AdminRepository;
  authUseCase: AuthUseCase;
}

export class AdminAuthUseCase {
  constructor(private readonly deps: AdminAuthUseCaseDeps) {}

  async login(body: AdminLoginBody) {
    const user = await this.deps.adminRepo.findActiveByUid(body.uid);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isValidPassword = await Bun.password.verify(body.password, user.passwordHash, 'bcrypt');

    if (!isValidPassword) {
      throw new InvalidCredentialsError();
    }

    const loggedIn = await this.deps.adminRepo.updateLastLoginAt(user.id);
    const { id, uid, username, role, lastLoginAt } = loggedIn ?? user;
    const token = await this.deps.authUseCase.sign({ id: user.id, role: user.role });

    return {
      token,
      user: {
        id,
        uid,
        username,
        role,
        lastLoginAt,
      },
    };
  }
}
