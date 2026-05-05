import type { DbClient } from '@server/db';
import Elysia from 'elysia';

import { OrderUseCase } from './usecase';

export * from './domain';
export * from './repository';
export * from './usecase';

export const orderModule = ({ db }: { db: DbClient }) => {
  return new Elysia({ name: 'OrderModule' }).decorate('order', new OrderUseCase(db));
};
