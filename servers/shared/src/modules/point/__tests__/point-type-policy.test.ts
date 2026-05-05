import { describe, expect, it } from 'bun:test';

import type { PointType } from '@server/db/schema';

import { PointTypePolicy, PointTypeUnavailableError } from '../domain';

function pointType(status: 'active' | 'disabled'): PointType {
  return {
    id: crypto.randomUUID(),
    name: `策略积分 ${crypto.randomUUID()}`,
    description: null,
    icon: null,
    status,
    sort: 0,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };
}

describe('积分类型策略', () => {
  it('允许 active 积分类型', () => {
    expect(() => PointTypePolicy.assertAvailable(pointType('active'))).not.toThrow();
  });

  it('拒绝不存在的积分类型', () => {
    expect(() => PointTypePolicy.assertAvailable(null)).toThrow(PointTypeUnavailableError);
  });

  it('拒绝 disabled 积分类型', () => {
    expect(() => PointTypePolicy.assertAvailable(pointType('disabled'))).toThrow(
      PointTypeUnavailableError,
    );
  });
});
