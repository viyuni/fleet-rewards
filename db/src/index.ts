import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema/index.js';

export type DatabaseUrl = string;

export interface CreateDbPoolOptions {
  connectionString?: DatabaseUrl;
}

export function createDbPool(options: CreateDbPoolOptions = {}) {
  const connectionString = options.connectionString ?? process.env.DATABASE_URL;

  if (!connectionString) throw new Error('DATABASE_URL is required to create a database pool.');

  return new Pool({ connectionString });
}

export function createDb(pool = createDbPool()) {
  return drizzle(pool, { schema });
}

export type DbClient = ReturnType<typeof createDb>;
export type DbTransaction = Parameters<Parameters<DbClient['transaction']>[0]>[0];

export { schema };
