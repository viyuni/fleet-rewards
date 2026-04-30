import { JwtAuthenticator } from '@server/shared/jwt';

import { config } from '../../config';

export const authenticator = new JwtAuthenticator(config.JWT_SECRET);
