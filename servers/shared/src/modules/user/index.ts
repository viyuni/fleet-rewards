import type { DbExecutor } from '@server/db';
import Elysia from 'elysia';

import { UserUseCase } from './usecase';

export * from './domain';
export * from './repository';
export * from './repository/types';
export * from './usecase';

export const userModule = ({ db }: { db: DbExecutor }) => {
  return new Elysia({ name: 'UserModule' }).decorate('user', new UserUseCase(db));
};
