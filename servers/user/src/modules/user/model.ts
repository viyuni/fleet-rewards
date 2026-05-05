import type { users } from '@server/db/schema';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export type Users = InferSelectModel<typeof users>;
export type InsertUser = InferInsertModel<typeof users>;
export type UpdateUser = Partial<InsertUser>;
