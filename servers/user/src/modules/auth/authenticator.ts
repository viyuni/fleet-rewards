import { JwtAuthenticator } from '@server/shared/jwt';

import { config } from '#servers/user/config';

export const authenticator = new JwtAuthenticator(config.JWT_SECRET);
