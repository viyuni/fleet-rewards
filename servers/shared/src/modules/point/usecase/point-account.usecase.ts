import type { AdjustBalanceInput } from '@internal/shared/schema';
import type { DbExecutor } from '@server/db';

import { POINT_CHANGE_SOURCE_TYPE } from '../domain';
import { PointAccountRepository } from '../repository/point-account.repo';
import { PointBalanceUseCase } from './point-balance.usecase';

export class PointAccountUseCase {
  constructor(private readonly db: DbExecutor) {}

  async adjustBalance(adminId: string, input: AdjustBalanceInput) {
    return this.db.transaction(async tx => {
      // 确保账户存在并锁行
      const account = await PointAccountRepository.requireByIdForUpdate(tx, input.accountId);

      return PointBalanceUseCase.changeBalance(tx, account, {
        type: 'adjust',
        userId: account.userId,
        pointTypeId: account.pointTypeId,
        delta: input.delta,
        sourceType: POINT_CHANGE_SOURCE_TYPE.AdminAdjustment,
        sourceId: adminId,
        idempotencyKey: `admin:points:adjust:${adminId}:${input.requestId}`,
        remark: input.remark ?? '管理员调整积分',
        metadata: {
          adminId,
          requestId: input.requestId,
        },
      });
    });
  }
}
