import type { DbExecutor, DbTransaction } from '@server/db';
import { eqIfDefined, gteIfDefined, lteIfDefined, PageBuilder, parseDate } from '@server/db/helper';
import { pointTransactions } from '@server/db/schema';
import { and, desc, eq } from 'drizzle-orm';

import { PointTransactionNotFoundError } from '../domain';
import type { PointTransactionPageFilter } from './types';

export class PointTransactionRepository {
  constructor(private readonly db: DbExecutor) {}

  static async requireByIdForUpdate(tx: DbTransaction, transactionId: string) {
    const [transaction] = await tx
      .select()
      .from(pointTransactions)
      .where(eq(pointTransactions.id, transactionId))
      .for('update');

    if (!transaction) {
      throw new PointTransactionNotFoundError();
    }

    return transaction;
  }

  static async findByAccountAndIdempotencyKey(
    db: DbExecutor,
    input: { accountId: string; idempotencyKey: string },
  ) {
    return await db.query.pointTransactions.findFirst({
      where: {
        pointAccountId: input.accountId,
        idempotencyKey: input.idempotencyKey,
      },
    });
  }

  pageBuilder(filter: PointTransactionPageFilter) {
    return new PageBuilder(this.db, pointTransactions)
      .where(
        and(
          eqIfDefined(pointTransactions.userId, filter.userId),
          eqIfDefined(pointTransactions.type, filter.type),
          eqIfDefined(pointTransactions.pointTypeId, filter.pointTypeId),
          gteIfDefined(pointTransactions.createdAt, parseDate(filter.startTime)),
          lteIfDefined(pointTransactions.createdAt, parseDate(filter.endTime)),
        ),
      )
      .orderBy(desc(pointTransactions.createdAt))
      .page(filter.page)
      .pageSize(filter.pageSize);
  }
}
