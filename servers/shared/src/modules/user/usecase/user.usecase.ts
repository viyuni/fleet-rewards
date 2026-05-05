import type { UserPageQuery } from '@internal/shared';
import type { DbExecutor } from '@server/db';

import { UserNotFoundError, UserPolicy } from '../domain';
import { UserRepository } from '../repository';

export class UserUseCase {
  private readonly userRepo: UserRepository;

  constructor(private readonly db: DbExecutor) {
    this.userRepo = new UserRepository(db);
  }

  /**
   * 查询活动用户
   */
  static async requireAvailableById(db: DbExecutor, id: string) {
    const user = await UserRepository.findById(db, id);

    UserPolicy.assertAvailable(user);

    return user;
  }

  /**
   * 查询用户列表
   */
  async list(filter: UserPageQuery = {}) {
    return await this.userRepo.pageBuilder(filter).paginate();
  }

  /**
   * 封禁用户
   */
  async ban(id: string) {
    const user = await this.userRepo.ban(id);

    if (!user) {
      throw new UserNotFoundError();
    }

    return user;
  }

  /**
   * 恢复用户
   */
  async restore(id: string) {
    const user = await this.userRepo.restore(id);

    if (!user) {
      throw new UserNotFoundError();
    }

    return user;
  }
}
