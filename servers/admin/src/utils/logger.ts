import { createLogger } from '@server/shared/logger';

import { env } from './env';

export const logger = createLogger(env);
