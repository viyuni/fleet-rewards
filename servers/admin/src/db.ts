import { createDatabase } from '@server/db';

import { env } from './utils';

export const db = createDatabase(env.DATABASE_URL);
