import type { InferSelectModel, InferInsertModel, InferEnum } from 'drizzle-orm';

import type { pointTypes, pointTypeStatusEnum } from '#server/shared/db/schemas';

export type PointType = InferSelectModel<typeof pointTypes>;
export type PointTypeStatus = InferEnum<typeof pointTypeStatusEnum>;
export type InsertPointType = InferInsertModel<typeof pointTypes>;
export type UpdatePointType = Partial<InsertPointType>;
