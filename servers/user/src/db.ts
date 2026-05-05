import { createDatabase } from '@server/db';

import { config } from './config';

export const db = createDatabase(config.DATABASE_URL);
