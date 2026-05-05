import type { AdminLoginInput, AdminRegisterInput } from '@internal/shared/schema';
import type { DbExecutor } from '@server/db';
import { InvalidCredentialsError } from '@server/shared';
import type { JwtAuthenticator } from '@server/shared/auth';

import { AdminRepository } from '../../admin/repository';
import { AlreadyExistsError, DisabledError } from '../domain';

export class AuthUseCase {
  private adminRepo: AdminRepository;

  constructor(
    private db: DbExecutor,
    private authenticator: JwtAuthenticator,
  ) {
    this.adminRepo = new AdminRepository(db);
  }

  async login(input: AdminLoginInput) {
    const user = await this.adminRepo.findByBiliUid(input.biliUid);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isValidPassword = await Bun.password.verify(input.password, user.passwordHash, 'bcrypt');

    if (!isValidPassword) {
      throw new InvalidCredentialsError();
    }

    if (user.status === 'disabled') {
      throw new DisabledError();
    }

    const loggedIn = await this.adminRepo.updateLastLoginAt(user.id);
    const token = await this.authenticator.sign(user.id);

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

  async register(input: AdminRegisterInput) {
    const adminRepo = new AdminRepository(this.db);

    const existingBiliUidAdmin = await adminRepo.findByBiliUid(input.biliUid);

    if (existingBiliUidAdmin) {
      throw new AlreadyExistsError('管理员 B站 UID 已存在');
    }

    const passwordHash = await Bun.password.hash(input.password, {
      algorithm: 'bcrypt',
      cost: 12,
    });

    const admin = await adminRepo.create({
      biliUid: input.biliUid,
      username: input.username,
      passwordHash,
      remark: input.remark ?? null,
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
