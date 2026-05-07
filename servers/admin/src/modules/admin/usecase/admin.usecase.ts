import type { AdminRegisterBody } from '@internal/shared';
import { UnauthorizedError } from '@server/shared';

import { logger } from '#server/admin/logger';

import { AdminAlreadyExistsError } from '../domain/errors';
import type { AdminRepository } from '../repository';

interface AdminUseCaseDeps {
  adminRepo: AdminRepository;
}

export class AdminUseCase {
  constructor(private readonly deps: AdminUseCaseDeps) {}

  async me(userId: string) {
    const admin = await this.deps.adminRepo.findInfoById(userId);

    if (!admin) {
      throw new UnauthorizedError();
    }

    return admin;
  }

  async register(body: AdminRegisterBody) {
    const existingBiliUidAdmin = await this.deps.adminRepo.findByBiliUid(body.uid);

    if (existingBiliUidAdmin) {
      throw new AdminAlreadyExistsError('管理员 B站 UID 已存在');
    }

    const passwordHash = await Bun.password.hash(body.password, {
      algorithm: 'bcrypt',
      cost: 12,
    });

    const admin = await this.deps.adminRepo.create({
      uid: body.uid,
      username: body.username,
      passwordHash,
      remark: body.remark ?? null,
    });

    return {
      id: admin.id,
      uid: admin.uid,
      username: admin.username,
      status: admin.status,
      remark: admin.remark,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };
  }

  static DEFAULT_ADMIN = {
    uid: `0721`,
    username: `Admin`,
  } as const;

  async initDefaultAdmin() {
    const { uid, username } = AdminUseCase.DEFAULT_ADMIN;
    const existing = await this.deps.adminRepo.findByBiliUid(uid);

    if (existing) {
      return;
    }

    const radomPassword = crypto.randomUUID().split('-').join('').slice(0, 8);

    this.register({
      uid,
      username: username,
      password: radomPassword,
      remark: 'Default Admin',
    });

    logger.info(
      `Creating default admin, UID: ${uid}, UserName: ${username}, Password: ${radomPassword}`,
    );
  }
}
