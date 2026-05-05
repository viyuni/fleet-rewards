import { defineRelations } from 'drizzle-orm';

import * as schema from './schema';

export const relations = defineRelations(schema, r => ({
  users: {
    pointAccounts: r.many.pointAccounts({
      from: r.users.id,
      to: r.pointAccounts.userId,
    }),
  },
}));
