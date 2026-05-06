import type { AdjustBalanceBody } from '@internal/shared/schema';
import type { DbClient } from '@server/db';

import { POINT_CHANGE_SOURCE_TYPE } from '../domain';
import { PointAccountRepository } from '../repository/point-account.repo';
import { PointBalanceUseCase } from './point-balance.usecase';

export interface PointAccountUseCaseDeps {
  db: DbClient;
  pointAccountRepo: PointAccountRepository;
  pointBalanceUseCase: PointBalanceUseCase;
}

export class PointAccountUseCase {
  constructor(private readonly deps: PointAccountUseCaseDeps) {}

  async adjustBalance(adminId: string, data: AdjustBalanceBody) {
    return this.deps.db.transaction(async tx => {
      // 确保账户存在并锁行
      const account = await this.deps.pointAccountRepo.requireByIdForUpdate(tx, data.accountId);

      return this.deps.pointBalanceUseCase.changeBalance(tx, account, {
        type: 'adjust',
        userId: account.userId,
        pointTypeId: account.pointTypeId,
        delta: data.delta,
        sourceType: POINT_CHANGE_SOURCE_TYPE.AdminAdjustment,
        sourceId: adminId,
        idempotencyKey: `admin:points:adjust:${adminId}:${data.nonce}`,
        remark: data.remark ?? '管理员调整积分',
        metadata: {
          adminId,
          nonce: data.nonce,
        },
      });
    });
  }
}
