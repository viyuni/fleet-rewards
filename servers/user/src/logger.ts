import { createLogger } from '@server/shared';

import { config } from './config';

export const logger = createLogger(config);
