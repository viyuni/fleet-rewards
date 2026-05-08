import type {
  AdminCreateBody,
  AdminPageQuery,
  AdminUpdateBody,
  AdminUpdatePasswordBody,
} from '@internal/shared/admin';
import type { AdminRole } from '@server/db/schema';
import { InvalidCredentialsError, UnauthorizedError } from '@server/shared';
import { PasswordUtil } from '@server/shared/utils';

import { config, logger } from '#server/admin/utils';

import {
  AdminAlreadyExistsError,
  AdminNotFoundError,
  AdminSuperAdminCannotBeBannedError,
} from '../domain/errors';
import type { AdminRepository } from '../repository';

interface AdminUseCaseDeps {
  adminRepo: AdminRepository;
}

export class AdminUseCase {
  constructor(private readonly deps: AdminUseCaseDeps) {}

  async me(adminId: string) {
    const admin = await this.deps.adminRepo.findActiveInfoById(adminId);

    if (!admin) {
      throw new UnauthorizedError();
    }

    return admin;
  }

  async create(body: AdminCreateBody) {
    return this.createAdmin(body);
  }

  async page(query: AdminPageQuery) {
    return this.deps.adminRepo.page(query);
  }

  async update(adminId: string, body: AdminUpdateBody) {
    return this.updateAdmin(adminId, body);
  }

  async updateMe(adminId: string, body: AdminUpdateBody) {
    return this.updateAdmin(adminId, body);
  }

  private async updateAdmin(adminId: string, body: AdminUpdateBody) {
    const admin = await this.deps.adminRepo.findActiveById(adminId);

    if (!admin) {
      throw new AdminNotFoundError();
    }

    if (body.username && body.username !== admin.username) {
      const existingUsernameAdmin = await this.deps.adminRepo.findByUsername(body.username);

      if (existingUsernameAdmin) {
        throw new AdminAlreadyExistsError('管理员用户名已存在');
      }
    }

    const updated = await this.deps.adminRepo.update(adminId, body);

    if (!updated) {
      throw new AdminNotFoundError();
    }

    return updated;
  }

  async requireAvailableById(adminId: string) {
    const admin = await this.deps.adminRepo.findById(adminId);

    if (!admin) {
      throw new AdminNotFoundError();
    }

    return admin;
  }

  async updatePassword(adminId: string, data: AdminUpdatePasswordBody) {
    const admin = await this.requireAvailableById(adminId);

    const isValidPassword = await PasswordUtil.verify(data.oldPassword, admin.passwordHash);

    if (!isValidPassword) {
      throw new InvalidCredentialsError();
    }

    const passwordHash = await PasswordUtil.hash(data.newPassword);
    await this.deps.adminRepo.updatePassword(adminId, passwordHash);
  }

  async resetPassword(adminId: string) {
    const admin = await this.requireAvailableById(adminId);

    const password = PasswordUtil.generate();
    const passwordHash = await PasswordUtil.hash(password);

    await this.deps.adminRepo.updatePassword(admin.id, passwordHash);

    return password;
  }

  async ban(adminId: string) {
    const admin = await this.deps.adminRepo.findActiveById(adminId);

    if (!admin) {
      throw new AdminNotFoundError();
    }

    if (admin.role === 'superAdmin') {
      throw new AdminSuperAdminCannotBeBannedError();
    }

    const banned = await this.deps.adminRepo.ban(adminId);

    if (!banned) {
      throw new AdminNotFoundError();
    }

    return banned;
  }

  async restore(adminId: string) {
    const admin = await this.deps.adminRepo.findById(adminId);

    if (!admin) {
      throw new AdminNotFoundError();
    }

    const restored = await this.deps.adminRepo.restore(adminId);

    if (!restored) {
      throw new AdminNotFoundError();
    }

    return restored;
  }

  private async createAdmin(body: AdminCreateBody, role: AdminRole = 'admin') {
    const existingBiliUidAdmin = await this.deps.adminRepo.findByUid(body.uid);

    if (existingBiliUidAdmin) {
      throw new AdminAlreadyExistsError('管理员 B站 UID 已存在');
    }

    const passwordHash = await PasswordUtil.hash(body.password);

    const admin = await this.deps.adminRepo.create({
      uid: body.uid,
      username: body.username,
      passwordHash,
      role,
      remark: body.remark ?? null,
    });

    return {
      id: admin.id,
      uid: admin.uid,
      username: admin.username,
      status: admin.status,
      role: admin.role,
      remark: admin.remark,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };
  }

  async initDefaultAdmin() {
    const {
      SUPER_ADMIN_UID: uid,
      SUPER_ADMIN_USERNAME: username,
      SUPER_ADMIN_PASSWORD: password,
    } = config;

    const existing = await this.deps.adminRepo.findByUid(uid);

    if (existing) {
      return;
    }

    await this.createAdmin(
      {
        uid,
        username,
        password,
        remark: 'Default Admin',
      },
      'superAdmin',
    );

    logger.info(
      `Creating default admin, UID: ${uid}, UserName: ${username}, Password: ${password}`,
    );
  }
}
