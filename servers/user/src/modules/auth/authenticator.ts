import { JwtAuthenticator, config } from '@gr/server-shared';

export const authenticator = new JwtAuthenticator(config.USER_JWT_SECRET);
