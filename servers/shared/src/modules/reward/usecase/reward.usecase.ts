import type { DbExecutor } from '@server/db';

import { POINT_CHANGE_SOURCE_TYPE, PointTypePolicy } from '#server/shared/modules/point';
import {
  PointAccountRepository,
  PointTransactionRepository,
  PointTypeRepository,
} from '#server/shared/modules/point/repository';
import { PointBalanceUseCase } from '#server/shared/modules/point/usecase';
import { UserPolicy } from '#server/shared/modules/user/domain';
import { UserRepository } from '#server/shared/modules/user/repository';

import { RewardRulePolicy, type BiliGuardRewardEvent } from '../domain';
import { RewardRuleRepository } from '../repository';

export class RewardUseCase {
  private readonly rewardRuleRepo: RewardRuleRepository;

  constructor(private readonly db: DbExecutor) {
    this.rewardRuleRepo = new RewardRuleRepository(db);
  }

  async previewBiliGuard(event: BiliGuardRewardEvent, now = new Date()) {
    const rules = await this.rewardRuleRepo.listCandidates(now);
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
    return await this.db.transaction(async tx => {
      const user = await UserRepository.findByBiliUid(tx, String(event.uid));

      UserPolicy.assertAvailable(user);

      const rewardRuleRepo = new RewardRuleRepository(tx);
      const rules = await rewardRuleRepo.listCandidates(now);
      const matchedRules = rules.filter(rule => RewardRulePolicy.matchesBiliGuard(rule, event));
      const effectiveRules = RewardRulePolicy.pickEffectiveRules(matchedRules);
      const results = [];

      for (const rule of effectiveRules) {
        const pointType = await PointTypeRepository.findById(tx, rule.pointTypeId);
        PointTypePolicy.assertAvailable(pointType);

        const account = await PointAccountRepository.ensureAccountAndLock(tx, {
          userId: user.id,
          pointTypeId: rule.pointTypeId,
        });

        const idempotencySource = event.stableKey ?? event.id;
        const idempotencyKey = `bili-guard:${idempotencySource}:rule:${rule.id}`;
        const existingTransaction = await PointTransactionRepository.findByAccountAndIdempotencyKey(
          tx,
          {
            accountId: account.id,
            idempotencyKey,
          },
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

        const result = await PointBalanceUseCase.changeBalance(tx, account, {
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
          duplicated: false,
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
