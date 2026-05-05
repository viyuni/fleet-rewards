export abstract class IntegerValuePolicy {
  protected static label = '数值';

  protected static createError(message: string): Error {
    return new Error(message);
  }

  static assertIsInteger(value: number) {
    if (!Number.isInteger(value)) {
      throw this.createError(`${this.label}必须为整数`);
    }
  }

  static assertPositiveInteger(value: number) {
    this.assertIsInteger(value);

    if (value <= 0) {
      throw this.createError(`${this.label}必须大于 0`);
    }
  }

  static assertNonZeroInteger(value: number) {
    this.assertIsInteger(value);

    if (value === 0) {
      throw this.createError(`${this.label}不能为 0`);
    }
  }
}
