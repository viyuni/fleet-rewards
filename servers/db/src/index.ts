import { drizzle } from 'drizzle-orm/node-postgres';

import { relations } from './relations.ts';
import * as schema from './schema/index.ts';

export function createDatabase(connectionString: string) {
  return drizzle(connectionString, { schema, relations });
}

export type DbClient = ReturnType<typeof createDatabase>;
export type DbTransaction = Parameters<Parameters<DbClient['transaction']>[0]>[0];
export type DbExecutor = DbClient | DbTransaction;
