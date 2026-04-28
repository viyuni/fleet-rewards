import type { InferSelectModel } from 'drizzle-orm';

import type { users } from '#server/db/schema';

export type Users = InferSelectModel<typeof users>;
