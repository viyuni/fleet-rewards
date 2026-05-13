import type { Product } from '#db/schema';

import { ProductUnavailableError } from './errors';

export type AvailableProduct = Product & {
  status: 'active';
};

export class ProductPolicy {
  static isAvailable(product: Product | null | undefined): product is AvailableProduct {
    return product?.status === 'active';
  }

  static assertAvailable(product: Product | null | undefined): asserts product is AvailableProduct {
    if (!ProductPolicy.isAvailable(product)) {
      throw new ProductUnavailableError();
    }
  }

  static shouldActivate(product: Product) {
    return product.status !== 'active';
  }

  static shouldDisable(product: Product) {
    return product.status !== 'disabled';
  }
}
