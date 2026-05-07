import { createDatabase } from '@server/db';

import { config } from './utils';

export const db = createDatabase(config.DATABASE_URL);
