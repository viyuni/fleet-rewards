import type {
  CreateProductInput,
  StockAdjustmentInput,
  UpdateProductInput,
} from '@internal/shared/schema';
import type { DbExecutor, DbTransaction } from '@server/db';
import { productStockMovements, type Product } from '@server/db/schema';

import { PointTypeUseCase } from '#server/shared/modules/point';

import {
  ProductInputPolicy,
  ProductNotFoundError,
  ProductUnavailableError,
  StockAmountPolicy,
  StockMovementCreateFailedError,
  StockMovementPolicy,
  StockPolicy,
} from '../domain';
import { ProductRepository } from '../repository';
import { STOCK_MOVEMENT_SOURCE_TYPE, type ChangeStockInput } from './types';

export class ProductUseCase {
  private readonly productRepo: ProductRepository;
  private readonly pointType: PointTypeUseCase;

  constructor(private readonly db: DbExecutor) {
    this.productRepo = new ProductRepository(db);
    this.pointType = new PointTypeUseCase(db);
  }

  /**
   * 获取商品信息
   */
  async get(id: string) {
    const product = await this.productRepo.findById(id);

    if (!product) {
      throw new ProductNotFoundError();
    }

    return product;
  }

  /**
   * 创建商品
   */
  async create(input: CreateProductInput) {
    await this.pointType.requireAvailableById(input.pointTypeId);
    ProductInputPolicy.assertValid(input);

    return this.productRepo.create(input);
  }

  /**
   * 更新商品
   */
  async update(id: string, input: UpdateProductInput) {
    ProductInputPolicy.assertValid(input);

    return this.productRepo.update(id, input);
  }

  /**
   * 上架商品
   */
  async active(id: string) {
    const product = await this.get(id);

    if (product.status === 'active') {
      return product;
    }

    return this.productRepo.updateStatus(id, 'active');
  }

  /**
   * 下架商品
   */
  async disable(id: string) {
    const product = await this.get(id);

    if (product.status === 'disabled') {
      return product;
    }

    return this.productRepo.updateStatus(id, 'disabled');
  }

  static async requireByIdForUpdate(tx: DbTransaction, id: string) {
    const product = await ProductRepository.findByIdForUpdate(tx, id);

    if (!product) {
      throw new ProductNotFoundError();
    }

    if (product.status !== 'active') {
      throw new ProductUnavailableError();
    }

    return product;
  }

  /**
   * 更改库存
   */
  async changeStock(tx: DbTransaction, product: Product, input: ChangeStockInput) {
    StockAmountPolicy.assertNonZeroInteger(input.delta);
    StockMovementPolicy.assertDeltaMatchesType(input.type, input.delta);

    let updateProduct: Product;

    if (input.delta > 0) {
      updateProduct = await ProductRepository.increaseStock(tx, {
        productId: product.id,
        amount: input.delta,
      });
    } else {
      // 确保 delta 为正, 扣除时只能为正数
      const amount = Math.abs(input.delta);

      // 确保库存充足
      StockPolicy.assertSufficientStock(product, amount);

      updateProduct = updateProduct = await ProductRepository.decreaseStock(tx, {
        productId: product.id,
        amount,
      });
    }

    const [movement] = await tx
      .insert(productStockMovements)
      .values({
        productId: input.productId,
        type: input.type,
        delta: input.delta,
        stockBefore: product.stock,
        stockAfter: updateProduct.stock,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        idempotencyKey: input.idempotencyKey,
        remark: input.remark,
        metadata: input.metadata,
      })
      .returning();

    if (!movement) {
      throw new StockMovementCreateFailedError();
    }

    return {
      movement,
      product: updateProduct,
    };
  }

  /**
   * 管理员操作库存
   */
  async adminAdjustStock(productId: string, adminId: string, input: StockAdjustmentInput) {
    return this.db.transaction(async tx => {
      const product = await ProductUseCase.requireByIdForUpdate(tx, productId);

      return await this.changeStock(tx, product, {
        type: 'adjust',
        productId,
        delta: input.delta,
        sourceType: STOCK_MOVEMENT_SOURCE_TYPE.adjust,
        sourceId: adminId,
        idempotencyKey: `admin:stock:adjust:${productId}:${adminId}:${input.requestId}`,
        remark: input.remark ?? `管理员调整库存：${product.name}`,
        metadata: {
          adminId,
          productId,
          productName: product.name,
          delta: input.delta,
        },
      });
    });
  }
}
