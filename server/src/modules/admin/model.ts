import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

import type { admins } from '#server/db/schema';

export type Admin = InferSelectModel<typeof admins>;
export type InsertAdmin = InferInsertModel<typeof admins>;
