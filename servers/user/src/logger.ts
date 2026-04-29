import { createLogger } from '@gr/server-shared';

import { config } from './config';

export const logger = createLogger(config);
