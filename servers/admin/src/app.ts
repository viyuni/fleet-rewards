import { initDefaultAdmin } from './context';
import { app } from './server';
import { config } from './utils/config';
import { logger } from './utils/logger';

await initDefaultAdmin();

app.listen({ port: config.PORT }, logger.printUrls);
