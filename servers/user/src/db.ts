import { createDb } from '@gr/server-shared/db';

import { config } from './config';

export const db = createDb(config.DATABASE_URL);
