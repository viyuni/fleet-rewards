import type { User } from '@server/db/schema';

import { UserUnavailableError } from './errors';

export type AvailableUser = User & {
  status: 'normal';
};

export class UserPolicy {
  static isAvailable(user: User | null | undefined): user is AvailableUser {
    return user?.status === 'normal';
  }

  // 确保账户未封禁
  static assertAvailable(user: User | null | undefined): asserts user is AvailableUser {
    if (!UserPolicy.isAvailable(user)) {
      throw new UserUnavailableError();
    }
  }
}
