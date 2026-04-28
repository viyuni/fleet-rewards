import type { admins } from '@gr/server-shared';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export type Admin = InferSelectModel<typeof admins>;
export type InsertAdmin = InferInsertModel<typeof admins>;
export type UpdateAdmin = Partial<InsertAdmin>;
