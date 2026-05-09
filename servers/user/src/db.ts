import { createDatabase } from '@server/db';

import { env } from './env';

export const db = createDatabase(env.DATABASE_URL);
