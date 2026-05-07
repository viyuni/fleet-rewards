import type { InferEnum, InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { index, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { timestamps } from './column-helpers.ts';

export const adminStatusEnum = pgEnum('admin_status', ['active', 'disabled']);

/** 管理员表 */
export const admins = pgTable(
  'admins',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    uid: text('uid').notNull().unique('admins_uid_unique'),
    username: text('username').notNull().unique(),
    status: adminStatusEnum('status').notNull().default('active'),
    passwordHash: text('password_hash').notNull(),
    lastLoginAt: timestamp('last_login_at'),
    remark: text('remark'),
    ...timestamps,
  },
  t => [
    index('admins_status_idx').on(t.status),
    index('admins_uid').on(t.uid),
    index('admins_created_at_idx').on(t.createdAt),
  ],
);

export type AdminStatus = InferEnum<typeof adminStatusEnum>;
export type Admin = InferSelectModel<typeof admins>;
export type InsertAdmin = InferInsertModel<typeof admins>;
export type UpdateAdmin = Partial<InsertAdmin>;
