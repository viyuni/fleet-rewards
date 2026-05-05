import { ConflictError, NotFoundError } from '#server/shared/errors';

export class RewardRuleNotFoundError extends NotFoundError {
  override code = 'REWARD_RULE_NOT_FOUND';

  constructor(message = '积分奖励规则不存在') {
    super(message);
  }
}

export class RewardRuleTimeRangeInvalidError extends ConflictError {
  override code = 'REWARD_RULE_TIME_RANGE_INVALID';

  constructor(message = '积分奖励规则生效时间不合法') {
    super(message);
  }
}

export const RewardErrors = {
  RewardRuleNotFoundError,
  RewardRuleTimeRangeInvalidError,
};
