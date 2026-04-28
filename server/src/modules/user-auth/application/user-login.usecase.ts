import type { DbClient } from '#server/db';
import { UserRepository } from '#server/modules/user/infra/user.repository';
import { AuthErrors } from '#server/shared/errors';
import type { UserLoginInput } from '#shared/schema';

export type UserLoginOutput = {
  id: string;
  biliUid: string;
  username: string;
  status: 'normal' | 'banned';
};

export class UserLoginUseCase {
  constructor(private db: DbClient) {}

  async execute(input: UserLoginInput): Promise<UserLoginOutput> {
    return this.db.transaction(async tx => {
      const userRepository = new UserRepository(tx);
      const user = await userRepository.findByUsername(input.username);

      if (!user) {
        throw new AuthErrors.InvalidCredentialsError();
      }

      const isValidPassword = await Bun.password.verify(input.password, user.passwordHash);

      if (!isValidPassword) {
        throw new AuthErrors.InvalidCredentialsError();
      }

      if (user.status === 'banned') {
        throw new AuthErrors.UserBannedError();
      }

      return {
        id: user.id,
        biliUid: user.biliUid,
        username: user.username,
        status: user.status,
      };
    });
  }
}
