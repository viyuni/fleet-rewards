import { defineRelations } from 'drizzle-orm';

import * as schema from './schema';

export const relations = defineRelations(schema, r => ({
  users: {
    pointAccounts: r.many.pointAccounts({
      from: r.users.id,
      to: r.pointAccounts.userId,
    }),
  },
  pointAccounts: {
    pointType: r.one.pointTypes({
      from: r.pointAccounts.pointTypeId,
      to: r.pointTypes.id,
    }),
  },
  products: {
    pointType: r.one.pointTypes({
      from: r.products.pointTypeId,
      to: r.pointTypes.id,
    }),
  },
  productStockMovements: {
    product: r.one.products({
      from: r.productStockMovements.productId,
      to: r.products.id,
    }),
  },
  rewardRules: {
    pointType: r.one.pointTypes({
      from: r.rewardRules.pointTypeId,
      to: r.pointTypes.id,
    }),
  },
}));
