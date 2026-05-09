import { createLogger } from '@server/shared';

import { env } from './env';

export const logger = createLogger(env);
