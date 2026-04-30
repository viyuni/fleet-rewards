import { createDb } from '@server/db';

import { config } from './config';

export const db = createDb(config.DATABASE_URL);
