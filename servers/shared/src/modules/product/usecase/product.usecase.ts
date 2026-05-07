import type {
  CreateProductBody,
  PageQuery,
  ProductPageQuery,
  StockAdjustmentBody,
  UpdateProductBody,
} from '@internal/shared/schema';
import type { DbClient, DbTransaction } from '@server/db';
import type { Product } from '@server/db/schema';

import { ImageUseCase } from '#server/shared/modules/image';
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
import { ProductRepository, StockMovementRepository } from '../repository';
import { STOCK_MOVEMENT_SOURCE_TYPE, type ChangeStockInput } from './types';

export interface ProductUseCaseDeps {
  db: DbClient;
  pointTypeUseCase: PointTypeUseCase;
  productRepo: ProductRepository;
  stockMovementRepo: StockMovementRepository;
  imageUseCase: ImageUseCase;
}

export class ProductUseCase {
  constructor(private readonly deps: ProductUseCaseDeps) {}

  /**
   * 获取商品信息
   */
  async get(id: string) {
    const product = await this.deps.productRepo.findById(id);

    if (!product) {
      throw new ProductNotFoundError();
    }

    return product;
  }

  /**
   * 创建商品
   */
  async create(productData: CreateProductBody) {
    await this.deps.pointTypeUseCase.requireAvailableById(productData.pointTypeId);
    ProductInputPolicy.assertValid(productData);

    const { cover, ...data } = productData;

    let coverName: string | undefined;

    if (cover) {
      coverName = await this.deps.imageUseCase.upload(cover).then(res => res.filename);
    }

    return this.deps.productRepo.create({ ...data, cover: coverName });
  }

  /**
   * 更新商品
   */
  async update(id: string, productData: UpdateProductBody) {
    ProductInputPolicy.assertValid(productData);

    const { cover, ...data } = productData;

    let coverName: string | undefined;

    if (cover) {
      coverName = await this.deps.imageUseCase.upload(cover).then(res => res.filename);
    }

    return this.deps.productRepo.update(id, { ...data, cover: coverName });
  }

  /**
   * 上架商品
   */
  async active(id: string) {
    const product = await this.get(id);

    if (product.status === 'active') {
      return product;
    }

    return this.deps.productRepo.updateStatus(id, 'active');
  }

  /**
   * 下架商品
   */
  async disable(id: string) {
    const product = await this.get(id);

    if (product.status === 'disabled') {
      return product;
    }

    return this.deps.productRepo.updateStatus(id, 'disabled');
  }

  async requireByIdForUpdate(tx: DbTransaction, id: string) {
    const product = await this.deps.productRepo.findByIdForUpdate(tx, id);

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
      updateProduct = await this.deps.productRepo.increaseStock(tx, {
        productId: product.id,
        amount: input.delta,
      });
    } else {
      // 确保 delta 为正, 扣除时只能为正数
      const amount = Math.abs(input.delta);

      // 确保库存充足
      StockPolicy.assertSufficientStock(product, amount);

      updateProduct = await this.deps.productRepo.decreaseStock(tx, {
        productId: product.id,
        amount,
      });
    }

    const movement = await this.deps.stockMovementRepo.create(
      {
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
      },
      tx,
    );

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
  async adminAdjustStock(productId: string, adminId: string, adjustmentData: StockAdjustmentBody) {
    return this.deps.db.transaction(async tx => {
      const product = await this.requireByIdForUpdate(tx, productId);

      return await this.changeStock(tx, product, {
        type: 'adjust',
        productId,
        delta: adjustmentData.delta,
        sourceType: STOCK_MOVEMENT_SOURCE_TYPE.adjust,
        sourceId: adminId,
        idempotencyKey: `admin:stock:adjust:${productId}:${adminId}:${adjustmentData.nonce}`,
        remark: adjustmentData.remark ?? `管理员调整库存：${product.name}`,
        metadata: {
          adminId,
          productId,
          productName: product.name,
          delta: adjustmentData.delta,
          nonce: adjustmentData.nonce,
        },
      });
    });
  }

  pageManage(query: ProductPageQuery) {
    return this.deps.productRepo.pageManage(query);
  }

  pageRedeem(query: PageQuery) {
    return this.deps.productRepo.pageRedeem(query);
  }
}
