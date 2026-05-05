import Elysia from 'elysia';

import { pointModule } from '#server/shared/modules/point';
import { db } from '#servers/user/db';

const pointTransaction = new Elysia({
  name: 'PointTransactionRoute',
  prefix: '/pointTransactions',
})
  .use(pointModule({ db }))
  .get('/', ({ pointTransaction }) => {});
