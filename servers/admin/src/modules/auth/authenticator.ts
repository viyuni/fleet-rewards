import { JwtAuthenticator, config } from '@gr/server-shared';

export const authenticator = new JwtAuthenticator(config.ADMIN_JWT_SECRET);
