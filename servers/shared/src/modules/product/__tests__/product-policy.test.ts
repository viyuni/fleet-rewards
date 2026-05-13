import { describe, expect, it } from 'bun:test';

import type { Product } from '@server/db/schema';

import { ProductPolicy, ProductUnavailableError } from '../domain';

function product(input: Partial<Product> = {}): Product {
  return {
    id: crypto.randomUUID(),
    name: `product_${crypto.randomUUID()}`,
    description: null,
    cover: null,
    coverPlaceholderUrl: null,
    detail: null,
    pointTypeId: crypto.randomUUID(),
    price: 1,
    status: 'active',
    stock: 1,
    deliveryType: 'manual',
    sort: 0,
    metadata: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...input,
  };
}

describe('商品策略', () => {
  it('识别可兑换商品', () => {
    expect(ProductPolicy.isAvailable(product({ status: 'active' }))).toBe(true);
    expect(() => ProductPolicy.assertAvailable(product({ status: 'active' }))).not.toThrow();
  });

  it('拒绝下架商品兑换', () => {
    expect(ProductPolicy.isAvailable(product({ status: 'disabled' }))).toBe(false);
    expect(() => ProductPolicy.assertAvailable(product({ status: 'disabled' }))).toThrow(
      ProductUnavailableError,
    );
  });

  it('判断上下架操作是否需要写库', () => {
    expect(ProductPolicy.shouldActivate(product({ status: 'disabled' }))).toBe(true);
    expect(ProductPolicy.shouldActivate(product({ status: 'active' }))).toBe(false);
    expect(ProductPolicy.shouldDisable(product({ status: 'active' }))).toBe(true);
    expect(ProductPolicy.shouldDisable(product({ status: 'disabled' }))).toBe(false);
  });
});
