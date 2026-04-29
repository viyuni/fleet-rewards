import { JwtAuthenticator } from '@gr/server-shared';

import { config } from '../../config';

export const authenticator = new JwtAuthenticator(config.JWT_SECRET);
