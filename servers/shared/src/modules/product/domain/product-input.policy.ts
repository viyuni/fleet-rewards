import type { CreateProductInput, UpdateProductInput } from '@internal/shared/schema';

import { ProductInvalidInputError } from './errors';

export class ProductInputPolicy {
  static assertValid(input: Partial<CreateProductInput & UpdateProductInput>) {
    if (input.price !== undefined) {
      ProductInputPolicy.assertPositiveInteger(input.price, '商品价格必须是正整数');
    }

    if (input.stock !== undefined && input.stock !== null) {
      ProductInputPolicy.assertNonNegativeInteger(input.stock, '商品库存必须是非负整数或不限库存');
    }
  }

  private static assertPositiveInteger(value: number, message: string) {
    if (!Number.isInteger(value) || value <= 0) {
      throw new ProductInvalidInputError(message);
    }
  }

  private static assertNonNegativeInteger(value: number, message: string) {
    if (!Number.isInteger(value) || value < 0) {
      throw new ProductInvalidInputError(message);
    }
  }
}
