import type { DbClient } from '#server/db';
import { AuthErrors } from '#server/shared/errors';
import type { AdminLoginInput, AdminRegisterInput } from '#shared/schema';

import { AdminRepository } from '../admin/repository';
import { JwtService } from '../jwt/service';
import { AdminAlreadyExistsError, AdminDisabledError } from './errors';

export class AdminUseCase {
  constructor(
    private db: DbClient,
    private jwt: JwtService,
  ) {}

  async login(input: AdminLoginInput) {
    return this.db.transaction(async tx => {
      const adminRepository = new AdminRepository(tx);
      const user = await adminRepository.findByUsername(input.username);

      if (!user) {
        throw new AuthErrors.InvalidCredentialsError();
      }

      const isValidPassword = await Bun.password.verify(input.password, user.passwordHash);

      if (!isValidPassword) {
        throw new AuthErrors.InvalidCredentialsError();
      }

      if (user.status === 'disabled') {
        throw new AdminDisabledError();
      }

      const loggedIn = await adminRepository.updateLastLoginAt(user.id);
      const token = await this.jwt.sign(user.id);

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
        throw new AdminAlreadyExistsError();
      }

      const existingBiliUidAdmin = await adminRepo.findByBiliUid(input.biliUid);

      if (existingBiliUidAdmin) {
        throw new AdminAlreadyExistsError('管理员 B站 UID 已存在');
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
