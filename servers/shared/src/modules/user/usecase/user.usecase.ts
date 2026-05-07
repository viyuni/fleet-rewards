import type {
  UpdateUserBody,
  UpdateUserPasswordBody,
  UserPageQuery,
  UserRegisterBody,
} from '@internal/shared';
import type { DbExecutor } from '@server/db';

import { InvalidCredentialsError } from '#server/shared/errors';

import {
  UserAlreadyRegisteredError,
  UserBasicInfoCrypto,
  UserNotFoundError,
  UserPolicy,
} from '../domain';
import { UserRepository } from '../repository';

export interface UserUseCaseDeps {
  userBasicInfoCrypto: UserBasicInfoCrypto;
  userRepo: UserRepository;
}

export class UserUseCase {
  constructor(private readonly deps: UserUseCaseDeps) {}

  /**
   * 查询可用用户
   */
  async requireAvailableById(userId: string, db?: DbExecutor) {
    const user = await this.deps.userRepo.findById(userId, db);

    UserPolicy.assertAvailable(user);

    return user;
  }

  /**
   * 查询可用用户通过 UID
   */
  async requireAvailableByBiliUid(biliUid: string, db?: DbExecutor) {
    const user = await this.deps.userRepo.findByBiliUid(biliUid, db);

    UserPolicy.assertAvailable(user);

    return user;
  }

  /**
   * 获取用户详情
   */
  async profile(userId: string) {
    const user = await this.deps.userRepo.findDetailById(userId);

    if (!user) {
      return null;
    }

    const { phoneEncrypted, emailEncrypted, addressEncrypted, ...profile } = user;

    return {
      ...profile,
      ...this.deps.userBasicInfoCrypto.decryptBasicInfo({
        phoneEncrypted,
        emailEncrypted,
        addressEncrypted,
      }),
    };
  }

  /**
   * 查询用户列表
   */
  async page(query: UserPageQuery) {
    const result = await this.deps.userRepo.page(query);

    return {
      ...result,
      items: result.items.map(user => {
        const { phoneEncrypted, emailEncrypted, addressEncrypted, ...item } = user;

        return {
          ...item,
          ...this.deps.userBasicInfoCrypto.decryptBasicInfo({
            phoneEncrypted,
            emailEncrypted,
            addressEncrypted,
          }),
        };
      }),
    };
  }

  /**
   * 封禁用户
   */
  async ban(id: string) {
    const user = await this.deps.userRepo.ban(id);

    if (!user) {
      throw new UserNotFoundError();
    }

    return user;
  }

  /**
   * 恢复用户
   */
  async restore(id: string) {
    const user = await this.deps.userRepo.restore(id);

    if (!user) {
      throw new UserNotFoundError();
    }

    return user;
  }

  /**
   * 创建用户
   */
  async create(data: UserRegisterBody) {
    const existing = await this.deps.userRepo.findByBiliUid(data.biliUid);

    if (existing) {
      throw new UserAlreadyRegisteredError();
    }

    const passwordHash = await Bun.password.hash(data.password, {
      algorithm: 'bcrypt',
      cost: 12,
    });

    const user = await this.deps.userRepo.create({
      ...data,
      ...this.deps.userBasicInfoCrypto.encryptBasicInfo(data),
      passwordHash,
    });

    return {
      id: user.id,
      biliUid: user.biliUid,
      username: user.username,
      email: data.email,
      phone: data.phone,
      address: data.address,
    };
  }

  async update(userId: string, data: UpdateUserBody) {
    const updatedUser = await this.deps.userRepo.update(userId, {
      ...data,
      ...this.deps.userBasicInfoCrypto.encryptBasicInfo(data),
    });

    return {
      id: updatedUser.id,
      biliUid: updatedUser.biliUid,
      username: updatedUser.username,
      email: data.email,
      phone: data.phone,
      address: data.address,
    };
  }

  async updatePassword(data: UpdateUserPasswordBody) {
    const user = await this.requireAvailableByBiliUid(data.biliUid);

    const isValidPassword = await Bun.password.verify(
      data.oldPassword,
      user.passwordHash,
      'bcrypt',
    );

    if (!isValidPassword) {
      throw new InvalidCredentialsError();
    }

    const passwordHash = await Bun.password.hash(data.newPassword, {
      algorithm: 'bcrypt',
      cost: 12,
    });

    await this.deps.userRepo.updatePassword(user.id, passwordHash);
  }

  /**
   * 重置用户密码
   *
   * - 账号不会退出
   */
  async resetPassword(userId: string) {
    const radomPassword = crypto.randomUUID().split('-').join('').slice(0, 12);
    const passwordHash = await Bun.password.hash(radomPassword, {
      algorithm: 'bcrypt',
      cost: 12,
    });

    await this.deps.userRepo.updatePassword(userId, passwordHash);

    return {
      password: radomPassword,
    };
  }
}
