import { pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core';

import { timestamps } from './helpers';

const userStatusEnum = pgEnum('user_status', ['normal', 'banned']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  biliUid: text('bili_uid').notNull().unique(),
  username: text('username').notNull().unique(),
  status: userStatusEnum('status').notNull().default('normal'),
  passwordHash: text('password_hash').notNull(),
  phoneEncrypted: text('phone_encrypted'),
  phoneHash: text('phone_hash').unique(),
  addressEncrypted: text('address_encrypted'),
  remark: text('remark'),
  ...timestamps,
});
