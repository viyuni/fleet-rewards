import type { AdminLoginInput, AdminRegisterInput } from '@internal/shared/schemas';
import type { DbExecutor } from '@server/db';
import { InvalidCredentialsError } from '@server/shared';

import type { JwtAuthenticator } from '#server/shared/modules/jwt';

import { AdminRepository } from '../admin/repository';
import { AuthErrors } from './errors';

export class AuthUseCase {
  constructor(
    private db: DbExecutor,
    private authenticator: JwtAuthenticator,
  ) {}

  async login(input: AdminLoginInput) {
    return this.db.transaction(async tx => {
      const adminRepository = new AdminRepository(tx);
      const user = await adminRepository.findByBiliUid(input.biliUid);

      if (!user) {
        throw new InvalidCredentialsError();
      }

      const isValidPassword = await Bun.password.verify(input.password, user.passwordHash);

      if (!isValidPassword) {
        throw new InvalidCredentialsError();
      }

      if (user.status === 'disabled') {
        throw new AuthErrors.DisabledError();
      }

      const loggedIn = await adminRepository.updateLastLoginAt(user.id);
      const token = await this.authenticator.sign(user.id);

      return {
        token,
        user: {
          id: user.id,
          biliUid: user.biliUid,
          username: user.username,
          status: user.status,
          lastLoginAt: loggedIn?.lastLoginAt ?? user.lastLoginAt,
          remark: user.remark,
        },
      };
    });
  }

  async register(input: AdminRegisterInput) {
    return this.db.transaction(async tx => {
      const adminRepo = new AdminRepository(tx);

      const existingAdmin = await adminRepo.findByUsername(input.username);

      if (existingAdmin) {
        throw new AuthErrors.AlreadyExistsError();
      }

      const existingBiliUidAdmin = await adminRepo.findByBiliUid(input.biliUid);

      if (existingBiliUidAdmin) {
        throw new AuthErrors.AlreadyExistsError('管理员 B站 UID 已存在');
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
    });
  }
}
