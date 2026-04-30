import type { admins } from '@server/shared';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export type Admin = InferSelectModel<typeof admins>;
export type InsertAdmin = InferInsertModel<typeof admins>;
export type UpdateAdmin = Partial<InsertAdmin>;
