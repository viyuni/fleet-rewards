import { createDb } from '@server/shared/db';

import { config } from './config';

export const db = createDb(config.DATABASE_URL);
