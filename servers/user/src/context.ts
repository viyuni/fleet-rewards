import { createAppContext } from '@server/shared/context';

import { env } from '#servers/user/env';

import { db } from './db';

const { context } = createAppContext({
  db,
  env,
});

export const appContext = context;
