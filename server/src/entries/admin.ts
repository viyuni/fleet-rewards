import { app } from '#server/apps/admin';
import { config } from '#server/shared/config';
import { logger } from '#server/shared/logger';

app.listen({ port: config.ADMIN_SERVER_PORT }, () => {
  logger.info(`Admin server listening on port ${config.ADMIN_SERVER_PORT}`);
  logger.info(`Admin server openapi docs: http://localhost:${config.ADMIN_SERVER_PORT}/openapi`);
});
