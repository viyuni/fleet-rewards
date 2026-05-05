import { describe, expect, it } from 'bun:test';

import { ProductInputPolicy } from '../domain';
import { ProductInvalidInputError } from '../domain';

describe('商品输入策略', () => {
  it('允许合法商品输入', () => {
    expect(() =>
      ProductInputPolicy.assertValid({
        price: 1,
        stock: 0,
      }),
    ).not.toThrow();
  });

  it('拒绝非法价格', () => {
    expect(() => ProductInputPolicy.assertValid({ price: 0 })).toThrow(ProductInvalidInputError);
    expect(() => ProductInputPolicy.assertValid({ price: -1 })).toThrow(ProductInvalidInputError);
    expect(() => ProductInputPolicy.assertValid({ price: 1.5 })).toThrow(ProductInvalidInputError);
    expect(() => ProductInputPolicy.assertValid({ price: Number.NaN })).toThrow(
      ProductInvalidInputError,
    );
  });

  it('拒绝非法库存', () => {
    expect(() => ProductInputPolicy.assertValid({ stock: -1 })).toThrow(ProductInvalidInputError);
    expect(() => ProductInputPolicy.assertValid({ stock: 1.5 })).toThrow(ProductInvalidInputError);
    expect(() => ProductInputPolicy.assertValid({ stock: Number.NaN })).toThrow(
      ProductInvalidInputError,
    );
  });
});
