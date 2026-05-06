import { createAppContext } from '@server/shared/context';

import { config } from '#servers/user/config';

import { db } from './db';
import { UserErrors } from './modules/user/errors';

function createUserAppContext() {
  const { appContext } = createAppContext({ db, secret: config.JWT_SECRET });

  return appContext.error(UserErrors);
}

export const appContext = createUserAppContext();
