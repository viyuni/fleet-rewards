import type { DbClient } from '#server/db';
import { UserRepository } from '#server/modules/user/infra/user.repository';
import { AuthErrors } from '#server/shared/errors';
import type { UserRegisterInput } from '#shared/schema';

export type UserRegisterOutput = {
  id: string;
  biliUid: string;
  username: string;
  status: 'normal' | 'banned';
  createdAt: Date;
  updatedAt: Date;
};

export class UserRegisterUseCase {
  constructor(private db: DbClient) {}

  async execute(input: UserRegisterInput): Promise<UserRegisterOutput> {
    return this.db.transaction(async tx => {
      const userRepository = new UserRepository(tx);

      const existingUser = await userRepository.findByUsername(input.username);

      if (existingUser) {
        throw new AuthErrors.UserAlreadyExistsError();
      }

      const existingBiliUidUser = await userRepository.findByBiliUid(input.biliUid);

      if (existingBiliUidUser) {
        throw new AuthErrors.UserAlreadyExistsError('用户 B站 UID 已存在');
      }

      const passwordHash = await Bun.password.hash(input.password, {
        algorithm: 'bcrypt',
        cost: 12,
      });

      const user = await userRepository.create({
        biliUid: input.biliUid,
        username: input.username,
        passwordHash,
      });

      return {
        id: user.id,
        biliUid: user.biliUid,
        username: user.username,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    });
  }
}
