import { config } from './config';
import { logger } from './logger';
import { app } from './server';

app.listen({ port: config.PORT }, logger.printUrls);
