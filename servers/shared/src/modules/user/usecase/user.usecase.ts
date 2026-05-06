import type { UserPageQuery } from '@internal/shared';
import type { DbExecutor } from '@server/db';

import { UserNotFoundError, UserPolicy } from '../domain';
import { UserRepository } from '../repository';

export interface UserUseCaseDeps {
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
   * 获取用户详情
   */
  async profile(userId: string) {
    return this.deps.userRepo.findDetailById(userId);
  }

  /**
   * 查询用户列表
   */
  async page(query: UserPageQuery) {
    return await this.deps.userRepo.page(query);
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
}
