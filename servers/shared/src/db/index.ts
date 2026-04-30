import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export * from './schemas/index.ts';
import * as schema from './schemas/index.ts';

export function createDb(connectionString?: string) {
  return drizzle(new Pool({ connectionString }), { schema });
}

export type DbClient = ReturnType<typeof createDb>;
export type DbTransaction = Parameters<Parameters<DbClient['transaction']>[0]>[0];
export type Db = DbClient | DbTransaction;

export { schema };
