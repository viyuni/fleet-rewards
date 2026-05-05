import { describe, expect, it } from 'bun:test';

import type { PointTransactionType } from '@server/db/schema';

import { InvalidPointTransactionDeltaError, PointTransactionPolicy } from '../domain';

const validCases: Array<[PointTransactionType, number]> = [
  ['grant', 1],
  ['consume', -1],
  ['refund', 1],
  ['adjust', 1],
  ['adjust', -1],
  ['reversal', 1],
  ['reversal', -1],
];

const invalidCases: Array<[PointTransactionType, number]> = [
  ['grant', 0],
  ['grant', -1],
  ['consume', 0],
  ['consume', 1],
  ['refund', 0],
  ['refund', -1],
  ['adjust', 0],
  ['reversal', 0],
];

describe('积分流水策略', () => {
  it.each(validCases)('允许 %s 类型使用 delta=%i', (type, delta) => {
    expect(() => PointTransactionPolicy.assertDeltaMatchesType(type, delta)).not.toThrow();
  });

  it.each(invalidCases)('拒绝 %s 类型使用 delta=%i', (type, delta) => {
    expect(() => PointTransactionPolicy.assertDeltaMatchesType(type, delta)).toThrow(
      InvalidPointTransactionDeltaError,
    );
  });
});
