import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { timestamps } from './helpers';

const adminStatusEnum = pgEnum('admin_status', ['active', 'disabled']);

export const admins = pgTable('admins', {
  id: uuid('id').primaryKey().defaultRandom(),
  biliUid: text('bili_uid').notNull().unique(),
  username: text('username').notNull().unique(),
  status: adminStatusEnum('status').notNull().default('active'),
  passwordHash: text('password_hash').notNull(),
  lastLoginAt: timestamp('last_login_at'),
  remark: text('remark'),
  ...timestamps,
});
