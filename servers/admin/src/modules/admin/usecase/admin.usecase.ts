import type { AdminCreateBody, AdminPageQuery, AdminUpdateBody } from '@internal/shared';
import type { AdminRole } from '@server/db/schema';
import { UnauthorizedError } from '@server/shared';

import { logger } from '#server/admin/utils';

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

  async me(userId: string) {
    const admin = await this.deps.adminRepo.findInfoById(userId);

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

  async update(id: string, body: AdminUpdateBody) {
    return this.updateAdmin(id, body);
  }

  async updateMe(userId: string, body: AdminUpdateBody) {
    return this.updateAdmin(userId, body);
  }

  private async updateAdmin(id: string, body: AdminUpdateBody) {
    const admin = await this.deps.adminRepo.findById(id);

    if (!admin) {
      throw new AdminNotFoundError();
    }

    if (body.username && body.username !== admin.username) {
      const existingUsernameAdmin = await this.deps.adminRepo.findByUsername(body.username);

      if (existingUsernameAdmin) {
        throw new AdminAlreadyExistsError('管理员用户名已存在');
      }
    }

    const updated = await this.deps.adminRepo.update(id, body);

    if (!updated) {
      throw new AdminNotFoundError();
    }

    return updated;
  }

  async ban(id: string) {
    const admin = await this.deps.adminRepo.findById(id);

    if (!admin) {
      throw new AdminNotFoundError();
    }

    if (admin.role === 'superAdmin') {
      throw new AdminSuperAdminCannotBeBannedError();
    }

    const banned = await this.deps.adminRepo.ban(id);

    if (!banned) {
      throw new AdminNotFoundError();
    }

    return banned;
  }

  async restore(id: string) {
    const admin = await this.deps.adminRepo.findById(id);

    if (!admin) {
      throw new AdminNotFoundError();
    }

    const restored = await this.deps.adminRepo.restore(id);

    if (!restored) {
      throw new AdminNotFoundError();
    }

    return restored;
  }

  private async createAdmin(body: AdminCreateBody, role: AdminRole = 'admin') {
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

  static DEFAULT_ADMIN: { uid: `${number}`; username: string } = {
    uid: `0721`,
    username: `Admin`,
  };

  async initDefaultAdmin() {
    const { uid, username } = AdminUseCase.DEFAULT_ADMIN;
    const existing = await this.deps.adminRepo.findByBiliUid(uid);

    if (existing) {
      return;
    }

    const radomPassword = crypto.randomUUID().split('-').join('').slice(0, 16);

    await this.createAdmin(
      {
        uid,
        username: username,
        password: radomPassword,
        remark: 'Default Admin',
      },
      'superAdmin',
    );

    logger.info(
      `Creating default admin, UID: ${uid}, UserName: ${username}, Password: ${radomPassword}`,
    );
  }
}
