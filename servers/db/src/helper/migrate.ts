import { fileURLToPath } from 'node:url';

import { migrate as startMigrate } from 'drizzle-orm/node-postgres/migrator';

import type { DbClient } from '..';

/**
 * 运行数据库迁移
 */
export async function migrate(db: DbClient) {
  console.log('Running migrations...');

  try {
    await startMigrate(db, {
      migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)),
    });

    console.log('Migrations completed!');
  } catch (err) {
    console.error('Migration failed!', err);
    process.exit(1);
  }
}
