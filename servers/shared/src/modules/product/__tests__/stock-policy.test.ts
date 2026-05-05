import { describe, expect, it } from 'bun:test';

import type { Product, ProductStockMovementType } from '@server/db/schema';

import {
  InvalidStockMovementDeltaError,
  StockInsufficientError,
  StockMovementPolicy,
  StockPolicy,
} from '../domain';

function product(input: Partial<Product> = {}): Product {
  return {
    id: crypto.randomUUID(),
    name: `策略商品 ${crypto.randomUUID()}`,
    description: null,
    cover: null,
    detail: null,
    pointTypeId: crypto.randomUUID(),
    price: 100,
    status: 'active',
    stock: 10,
    deliveryType: 'manual',
    sort: 0,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...input,
  };
}

const validMovementCases: Array<[ProductStockMovementType, number]> = [
  ['consume', -1],
  ['restore', 1],
  ['adjust', 1],
  ['adjust', -1],
];

const invalidMovementCases: Array<[ProductStockMovementType, number]> = [
  ['consume', 0],
  ['consume', 1],
  ['restore', 0],
  ['restore', -1],
  ['adjust', 0],
];

describe('商品库存策略', () => {
  describe('assertSufficientStock', () => {
    it('库存充足时通过', () => {
      expect(() => StockPolicy.assertSufficientStock(product({ stock: 10 }), 10)).not.toThrow();
    });

    it('库存不足时失败', () => {
      expect(() => StockPolicy.assertSufficientStock(product({ stock: 9 }), 10)).toThrow(
        StockInsufficientError,
      );
    });
  });

  describe('assertDeltaMatchesType', () => {
    it.each(validMovementCases)('允许 %s 类型使用 delta=%i', (type, delta) => {
      expect(() => StockMovementPolicy.assertDeltaMatchesType(type, delta)).not.toThrow();
    });

    it.each(invalidMovementCases)('拒绝 %s 类型使用 delta=%i', (type, delta) => {
      expect(() => StockMovementPolicy.assertDeltaMatchesType(type, delta)).toThrow(
        InvalidStockMovementDeltaError,
      );
    });
  });
});
