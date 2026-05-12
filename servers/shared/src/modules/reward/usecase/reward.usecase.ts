import type { DbClient } from '@server/db';

import {
  POINT_CHANGE_SOURCE_TYPE,
  PointIdempotencyKey,
  PointAccountRepository,
  PointBalanceUseCase,
  PointTransactionRepository,
  PointTypeUseCase,
} from '#server/shared/modules/point';
import { UserUseCase } from '#server/shared/modules/user';

import { RewardRulePolicy, type BiliGuardRewardEvent } from '../domain';
import { RewardRuleRepository } from '../repository';

export interface RewardUseCaseDeps {
  db: DbClient;
  pointAccountRepo: PointAccountRepository;
  pointBalanceUseCase: PointBalanceUseCase;
  pointTransactionRepo: PointTransactionRepository;
  pointTypeUseCase: PointTypeUseCase;
  rewardRuleRepo: RewardRuleRepository;
  userUseCase: UserUseCase;
}

export class RewardUseCase {
  constructor(private readonly deps: RewardUseCaseDeps) {}

  async previewBiliGuard(event: BiliGuardRewardEvent, now = new Date()) {
    const rules = await this.deps.rewardRuleRepo.listCandidates(now);
    const matchedRules = rules.filter(rule => RewardRulePolicy.matchesBiliGuard(rule, event));
    const effectiveRules = RewardRulePolicy.pickEffectiveRules(matchedRules);

    return {
      event,
      items: effectiveRules.map(rule => ({
        rule,
        pointTypeId: rule.pointTypeId,
        points: rule.points,
      })),
    };
  }

  async grantBiliGuard(event: BiliGuardRewardEvent, now = new Date()) {
    return await this.deps.db.transaction(async tx => {
      const user = await this.deps.userUseCase.getAvailableByBiliUid(String(event.uid), tx);

      const rules = await this.deps.rewardRuleRepo.listCandidates(now, tx);
      const matchedRules = rules.filter(rule => RewardRulePolicy.matchesBiliGuard(rule, event));
      const effectiveRules = RewardRulePolicy.pickEffectiveRules(matchedRules);
      const results = [];

      for (const rule of effectiveRules) {
        await this.deps.pointTypeUseCase.getAvailableById(rule.pointTypeId, tx);

        const account = await this.deps.pointAccountRepo.ensureAccountAndLock(tx, {
          userId: user.id,
          pointTypeId: rule.pointTypeId,
        });

        const idempotencySource = event.stableKey ?? event.id;
        const idempotencyKey = PointIdempotencyKey.biliGuard({
          sourceId: idempotencySource,
          ruleId: rule.id,
        });
        const existingTransaction =
          await this.deps.pointTransactionRepo.findByAccountAndIdempotencyKey(
            {
              accountId: account.id,
              idempotencyKey,
            },
            tx,
          );

        if (existingTransaction) {
          results.push({
            rule,
            pointTypeId: rule.pointTypeId,
            points: rule.points,
            account,
            transaction: existingTransaction,
            duplicated: true,
          });

          continue;
        }

        const result = await this.deps.pointBalanceUseCase.changeBalance(tx, account, {
          type: 'grant',
          userId: user.id,
          pointTypeId: rule.pointTypeId,
          delta: rule.points,
          sourceType: POINT_CHANGE_SOURCE_TYPE.GuardEvent,
          sourceId: idempotencySource,
          idempotencyKey,
          remark: `大航海积分奖励：${rule.name}`,
          metadata: {
            event,
            rule,
          },
        });

        results.push({
          rule,
          pointTypeId: rule.pointTypeId,
          points: rule.points,
          ...result,
        });
      }

      return {
        event,
        user,
        items: results,
      };
    });
  }
}
