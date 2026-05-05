import { describe, expect, it } from 'bun:test';

import type { PointAccount } from '@server/db/schema';

import {
  PointAccountBannedError,
  PointAccountPolicy,
  PointAccountSuspendedError,
  PointBalanceInsufficientError,
} from '../domain';

function pointAccount(input: Partial<PointAccount> = {}): PointAccount {
  return {
    id: crypto.randomUUID(),
    userId: crypto.randomUUID(),
    pointTypeId: crypto.randomUUID(),
    balance: 100,
    status: 'active',
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...input,
  };
}

describe('积分账户策略', () => {
  describe('assertCanIncrease', () => {
    it('允许 active 和 suspended 账户增加积分', () => {
      expect(() =>
        PointAccountPolicy.assertCanIncrease(pointAccount({ status: 'active' })),
      ).not.toThrow();
      expect(() =>
        PointAccountPolicy.assertCanIncrease(pointAccount({ status: 'suspended' })),
      ).not.toThrow();
    });

    it('拒绝 banned 账户增加积分', () => {
      expect(() =>
        PointAccountPolicy.assertCanIncrease(pointAccount({ status: 'banned' })),
      ).toThrow(PointAccountBannedError);
    });
  });

  describe('assertCanConsume', () => {
    it('允许 active 账户消费积分', () => {
      expect(() =>
        PointAccountPolicy.assertCanConsume(pointAccount({ status: 'active' })),
      ).not.toThrow();
    });

    it('拒绝 suspended 账户消费积分', () => {
      expect(() =>
        PointAccountPolicy.assertCanConsume(pointAccount({ status: 'suspended' })),
      ).toThrow(PointAccountSuspendedError);
    });

    it('拒绝 banned 账户消费积分', () => {
      expect(() => PointAccountPolicy.assertCanConsume(pointAccount({ status: 'banned' }))).toThrow(
        PointAccountBannedError,
      );
    });
  });

  describe('assertSufficientBalance', () => {
    it('余额充足时通过', () => {
      expect(() =>
        PointAccountPolicy.assertSufficientBalance(pointAccount({ balance: 100 }), 100),
      ).not.toThrow();
    });

    it('余额不足时失败', () => {
      expect(() =>
        PointAccountPolicy.assertSufficientBalance(pointAccount({ balance: 99 }), 100),
      ).toThrow(PointBalanceInsufficientError);
    });
  });
});
