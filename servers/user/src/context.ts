import { createAppContext } from '@server/shared/context';

import { config } from '#servers/user/config';

import { db } from './db';

const { context } = createAppContext({
  db,
  config,
});

export const appContext = context;
