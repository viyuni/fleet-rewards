import { createLogger } from '@server/shared/logger';

import { config } from './config';

export const logger = createLogger(config);
