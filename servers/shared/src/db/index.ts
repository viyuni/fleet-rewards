import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { config } from '../config.ts';
export * from './schema/index.ts';
import * as schema from './schema/index.ts';

export const db = drizzle(new Pool({ connectionString: config.DATABASE_URL }), { schema });

export type DbClient = typeof db;
export type DbTransaction = Parameters<Parameters<DbClient['transaction']>[0]>[0];
export type Db = DbClient | DbTransaction;

export { schema };
