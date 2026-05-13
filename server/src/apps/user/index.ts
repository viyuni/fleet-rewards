import { logger } from '#utils';

import { app } from './server';

app.compile().listen({}, logger.printUrls);
