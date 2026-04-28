import { logger } from '../logger';

export function printUrls(server: Bun.Server<unknown>) {
  const protocol = 'http';
  const host = server.hostname === '0.0.0.0' ? 'localhost' : server.hostname;
  const baseUrl = `${protocol}://${host}:${server.port}`;

  logger.info(`➜  Local:   ${baseUrl}/`);
  logger.info(`➜  Docs:    ${baseUrl}/openapi`);
}
