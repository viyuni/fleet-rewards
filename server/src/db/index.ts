import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { env } from '#server/shared/config.ts';

import * as schema from './schema/index.ts';

export const db = drizzle(new Pool({ connectionString: env.DATABASE_URL }), { schema });

export type DbClient = typeof db;
export type DbTransaction = Parameters<Parameters<DbClient['transaction']>[0]>[0];

export { schema };
