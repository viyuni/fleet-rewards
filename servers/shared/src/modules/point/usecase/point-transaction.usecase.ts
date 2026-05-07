import type {
  PointTransactionPageQuery,
  PointTransactionType,
  ReversalPointTransactionBody,
} from '@internal/shared';
import type { DbClient } from '@server/db';

import { POINT_CHANGE_SOURCE_TYPE, PointTransactionAlreadyReversedError } from '../domain';
import { PointAccountRepository, PointTransactionRepository } from '../repository';
import { PointBalanceUseCase } from './point-balance.usecase';

export interface PointTransactionUseCaseDeps {
  db: DbClient;
  pointAccountRepo: PointAccountRepository;
  pointBalanceUseCase: PointBalanceUseCase;
  pointTransactionRepo: PointTransactionRepository;
}

export class PointTransactionUseCase {
  constructor(private readonly deps: PointTransactionUseCaseDeps) {}

  /**
   * 冲正积分流水
   */
  async reversal(adminId: string, data: ReversalPointTransactionBody) {
    return this.deps.db.transaction(async tx => {
      // 获取原始积分交易记录并行锁
      const original = await this.deps.pointTransactionRepo.requireByIdForUpdate(
        tx,
        data.transactionId,
      );

      // 不允许重复冲正
      if (original.reversalOfTransactionId) {
        throw new PointTransactionAlreadyReversedError();
      }

      // 锁账户
      const account = await this.deps.pointAccountRepo.requireByIdForUpdate(
        tx,
        original.pointAccountId,
      );

      //  反转
      const reversalDelta = -original.delta;

      return await this.deps.pointBalanceUseCase.changeBalance(tx, account, {
        type: 'reversal',
        userId: original.userId,
        pointTypeId: original.pointTypeId,
        delta: reversalDelta,
        sourceType: POINT_CHANGE_SOURCE_TYPE.Reversal,
        sourceId: original.id,
        idempotencyKey: `point-transaction:${original.id}:reversal`,
        remark: data.remark ?? '积分流水冲正',
        metadata: {
          originalTransactionId: original.id,
          operatorId: adminId,
        },
        reversalOfTransactionId: original.id,
      });
    });
  }

  /**
   * 获取积分流水标题
   */
  private resolveTransactionTitle(input: {
    type: PointTransactionType;
    delta: number;
    sourceType: string | null;
  }) {
    // TODO 重构为 MAP 的形式匹配
    switch (input.sourceType) {
      case POINT_CHANGE_SOURCE_TYPE.OrderConsume:
        return '兑换商品';

      case POINT_CHANGE_SOURCE_TYPE.OrderRefund:
        return '订单退款';

      case POINT_CHANGE_SOURCE_TYPE.AdminAdjustment:
        return input.delta >= 0 ? '管理员补发' : '管理员扣减';

      case POINT_CHANGE_SOURCE_TYPE.Reversal:
        return '积分冲正';

      case POINT_CHANGE_SOURCE_TYPE.GuardEvent:
        return '大航海奖励';

      case POINT_CHANGE_SOURCE_TYPE.Conversion:
        return input.delta >= 0 ? '积分转换转入' : '积分转换转出';
    }

    switch (input.type) {
      case 'grant':
        return '获得积分';

      case 'consume':
        return '消耗积分';

      case 'refund':
        return '积分退回';

      case 'adjust':
        return input.delta >= 0 ? '积分调整增加' : '积分调整扣减';

      case 'reversal':
        return '积分冲正';
    }
  }

  private withTitle<
    T extends {
      type: PointTransactionType;
      delta: number;
      sourceType: string | null;
    },
  >(item: T) {
    return {
      ...item,
      title: this.resolveTransactionTitle(item),
    };
  }

  pageManage(query: PointTransactionPageQuery) {
    return this.deps.pointTransactionRepo.pageManage(query).then(res => ({
      ...res,
      items: res.items.map(item => ({
        ...item,
        title: this.withTitle(item),
      })),
    }));
  }

  private toMineItem<
    T extends {
      type: PointTransactionType;
      delta: number;
      sourceType: string | null;
    },
  >(item: T) {
    const { sourceType: _sourceType, ...rest } = item;

    return {
      ...rest,
      title: this.withTitle(item),
    };
  }

  async pageMine(userId: string, query: PointTransactionPageQuery) {
    const page = await this.deps.pointTransactionRepo.pageMine({ ...query, userId });

    return {
      ...page,
      items: page.items.map(item => this.toMineItem(item)),
    };
  }
}
