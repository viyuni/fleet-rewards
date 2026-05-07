import { config } from './config';
import { initDefaultAdmin } from './context';
import { logger } from './logger';
import { app } from './server';

await initDefaultAdmin();

app.listen({ port: config.PORT }, logger.printUrls);
