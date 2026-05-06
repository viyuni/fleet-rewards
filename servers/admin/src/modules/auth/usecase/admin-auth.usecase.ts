import type { AdminLoginBody, AdminRegisterBody } from '@internal/shared/schema';
import type { DbExecutor } from '@server/db';
import { InvalidCredentialsError } from '@server/shared';
import type { AuthUseCase } from '@server/shared/auth';

import { AdminRepository } from '../../admin/repository';
import { AlreadyExistsError, DisabledError } from '../domain';

export interface AdminAuthUseCaseDeps {
  db: DbExecutor;
  adminRepo: AdminRepository;
  authUseCase: AuthUseCase;
}

export class AdminAuthUseCase {
  constructor(private readonly deps: AdminAuthUseCaseDeps) {}

  async login(body: AdminLoginBody) {
    const user = await this.deps.adminRepo.findByBiliUid(body.biliUid);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isValidPassword = await Bun.password.verify(body.password, user.passwordHash, 'bcrypt');

    if (!isValidPassword) {
      throw new InvalidCredentialsError();
    }

    if (user.status === 'disabled') {
      throw new DisabledError();
    }

    const loggedIn = await this.deps.adminRepo.updateLastLoginAt(user.id);
    const token = await this.deps.authUseCase.sign(user.id);

    return {
      token,
      user: {
        id: user.id,
        biliUid: user.biliUid,
        username: user.username,
        status: user.status,
        lastLoginAt: loggedIn?.lastLoginAt ?? user.lastLoginAt,
      },
    };
  }

  async register(body: AdminRegisterBody) {
    const existingBiliUidAdmin = await this.deps.adminRepo.findByBiliUid(body.biliUid);

    if (existingBiliUidAdmin) {
      throw new AlreadyExistsError('管理员 B站 UID 已存在');
    }

    const passwordHash = await Bun.password.hash(body.password, {
      algorithm: 'bcrypt',
      cost: 12,
    });

    const admin = await this.deps.adminRepo.create({
      biliUid: body.biliUid,
      username: body.username,
      passwordHash,
      remark: body.remark ?? null,
    });

    return {
      id: admin.id,
      biliUid: admin.biliUid,
      username: admin.username,
      status: admin.status,
      remark: admin.remark,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };
  }
}
