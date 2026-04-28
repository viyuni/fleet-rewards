import { index, pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core';

import { timestamps } from './column-helpers';

const userStatusEnum = pgEnum('user_status', ['normal', 'banned']);

/** 用户表 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    biliUid: text('bili_uid').notNull().unique(),
    username: text('username').notNull().unique(),
    status: userStatusEnum('status').notNull().default('normal'),
    passwordHash: text('password_hash').notNull(),
    phoneEncrypted: text('phone_encrypted'),
    emailEncrypted: text('email_encrypted'),
    phoneHash: text('phone_hash').unique(),
    addressEncrypted: text('address_encrypted'),
    remark: text('remark'),
    ...timestamps,
  },
  t => [index('users_status_idx').on(t.status), index('users_created_at_idx').on(t.createdAt)],
);
