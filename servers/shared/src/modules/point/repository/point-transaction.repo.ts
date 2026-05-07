import type { PointTransactionPageQuery } from '@internal/shared';
import type { DbExecutor, DbTransaction } from '@server/db';
import { defineSelectColumns, parseDate, QueryPageBuilder } from '@server/db/helper';
import { pointTransactions } from '@server/db/schema';
import { eq } from 'drizzle-orm';

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

  pageManage(query: PointTransactionPageQuery) {
    return new QueryPageBuilder(this.db, pointTransactions, this.db.query.pointTransactions)
      .pageSize(query.pageSize)
      .page(query.page)
      .where({
        userId: query.userId,
        type: query.type,
        pointTypeId: query.pointTypeId,
        createdAt: {
          gte: parseDate(query.startTime),
          lte: parseDate(query.endTime),
        },
      })
      .query((findMany, { where, limit, offset }) =>
        findMany({
          where,
          limit,
          offset,
          orderBy: {
            createdAt: 'desc',
          },
        }),
      )
      .paginate();
  }

  pageMine(query: PointTransactionPageQuery) {
    return new QueryPageBuilder(this.db, pointTransactions, this.db.query.pointTransactions)
      .pageSize(query.pageSize)
      .page(query.page)
      .where({
        userId: query.userId,
        type: query.type,
        pointTypeId: query.pointTypeId,
        createdAt: {
          gte: parseDate(query.startTime),
          lte: parseDate(query.endTime),
        },
      })
      .query((findMany, { where, limit, offset }) =>
        findMany({
          where,
          limit,
          offset,
          columns: {
            id: true,
            pointTypeNameSnapshot: true,
            type: true,
            delta: true,
            balanceBefore: true,
            balanceAfter: true,
            sourceType: true,
            remark: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
      )
      .paginate();
  }
}
