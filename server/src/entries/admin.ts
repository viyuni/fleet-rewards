import { app } from '#server/apps/admin';
import { env } from '#server/shared/config';
import { logger } from '#server/shared/logger';

app.listen({ port: env.ADMIN_SERVER_PORT }, () => {
  logger.info(`Admin server listening on port ${env.ADMIN_SERVER_PORT}`);
});
