import { ProductInvalidInputError } from './errors';

export class ProductInputPolicy {
  static assertPrice(value: number | undefined) {
    if (value !== undefined) {
      ProductInputPolicy.assertPositiveInteger(value, '商品价格必须是正整数');
    }
  }

  static assertStock(value: number | null | undefined) {
    if (value !== undefined && value !== null) {
      ProductInputPolicy.assertNonNegativeInteger(value, '商品库存必须是非负整数或不限库存');
    }
  }

  static assertTimeRange(startTime: Date | null | undefined, endTime: Date | null | undefined) {
    if (startTime && endTime && startTime >= endTime) {
      throw new ProductInvalidInputError('商品开始时间必须早于结束时间');
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
