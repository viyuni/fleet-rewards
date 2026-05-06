import type { PointTransactionPageQuery } from '@internal/shared';
import type { DbExecutor, DbTransaction } from '@server/db';
import {
  defineSelectColumns,
  eqIfDefined,
  gteIfDefined,
  lteIfDefined,
  PageBuilder,
  parseDate,
} from '@server/db/helper';
import { pointTransactions } from '@server/db/schema';
import { and, desc, eq } from 'drizzle-orm';

import { PointTransactionNotFoundError } from '../domain';

const userPointTransactionSelectCols = defineSelectColumns(
  pointTransactions,
  ({ pointTypeNameSnapshot, type, delta, balanceBefore, balanceAfter, remark, createdAt }) => ({
    pointTypeNameSnapshot,
    type,
    delta,
    balanceBefore,
    balanceAfter,
    remark,
    createdAt,
  }),
);

export class PointTransactionRepository {
  constructor(private readonly db: DbExecutor) {}

  async requireByIdForUpdate(tx: DbTransaction, transactionId: string) {
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

  async findByAccountAndIdempotencyKey(
    input: { accountId: string; idempotencyKey: string },
    db: DbExecutor = this.db,
  ) {
    return await db.query.pointTransactions.findFirst({
      where: {
        pointAccountId: input.accountId,
        idempotencyKey: input.idempotencyKey,
      },
    });
  }

  pageBuilder(query: PointTransactionPageQuery) {
    return new PageBuilder(this.db, pointTransactions)
      .where(
        and(
          eqIfDefined(pointTransactions.userId, query.userId),
          eqIfDefined(pointTransactions.type, query.type),
          eqIfDefined(pointTransactions.pointTypeId, query.pointTypeId),
          gteIfDefined(pointTransactions.createdAt, parseDate(query.startTime)),
          lteIfDefined(pointTransactions.createdAt, parseDate(query.endTime)),
        ),
      )
      .orderBy(desc(pointTransactions.createdAt))
      .page(query.page)
      .pageSize(query.pageSize);
  }

  page(query: PointTransactionPageQuery) {
    return this.pageBuilder(query).paginate();
  }

  pageByUserId(userId: string, query: PointTransactionPageQuery) {
    return this.pageBuilder({
      ...query,
      userId,
    })
      .orderBy(desc(pointTransactions.createdAt))
      .columns(userPointTransactionSelectCols)
      .paginate();
  }
}
