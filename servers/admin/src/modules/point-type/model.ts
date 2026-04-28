import type { pointTypes } from '@gr/server-shared/db/schema';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export type PointType = InferSelectModel<typeof pointTypes>;
export type InsertPointType = InferInsertModel<typeof pointTypes>;
export type UpdatePointType = Partial<InsertPointType>;
