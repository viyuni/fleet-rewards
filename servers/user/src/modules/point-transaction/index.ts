import Elysia from 'elysia';

import { appContext } from '#servers/user/context';

const pointTransaction = new Elysia({
  name: 'PointTransactionRoute',
  prefix: '/pointTransactions',
})
  .use(appContext)
  .get('/', ({ pointTransactionUseCase }) => {});
