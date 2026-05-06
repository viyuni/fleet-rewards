import type { CreateOrderBody, RefundOrderBody } from '@internal/shared/schema';
import type { DbClient } from '@server/db';

import {
  POINT_CHANGE_SOURCE_TYPE,
  PointAccountRepository,
  PointBalanceUseCase,
  PointTypeUseCase,
} from '#server/shared/modules/point';
import {
  ProductUnavailableError,
  ProductUseCase,
  STOCK_MOVEMENT_SOURCE_TYPE,
} from '#server/shared/modules/product';
import { UserUseCase } from '#server/shared/modules/user';

import { OrderNotFoundError, OrderStatusInvalidError, OrderUpdateFailedError } from '../domain';
import { OrderRepository } from '../repository';

export interface OrderUseCaseDeps {
  db: DbClient;
  orderRepo: OrderRepository;
  pointAccountRepo: PointAccountRepository;
  pointBalanceUseCase: PointBalanceUseCase;
  pointTypeUseCase: PointTypeUseCase;
  productUseCase: ProductUseCase;
  userUseCase: UserUseCase;
}

export class OrderUseCase {
  constructor(private readonly deps: OrderUseCaseDeps) {}

  async get(id: string) {
    const order = await this.deps.orderRepo.findById(id);

    if (!order) {
      throw new OrderNotFoundError();
    }

    return order;
  }

  async create(userId: string, orderData: CreateOrderBody) {
    return this.deps.db.transaction(async tx => {
      const user = await this.deps.userUseCase.requireAvailableById(userId, tx);
      const product = await this.deps.productUseCase.requireByIdForUpdate(tx, orderData.productId);

      // 确保账户存在并锁行
      const account = await this.deps.pointAccountRepo.ensureAccountAndLock(tx, {
        userId: user.id,
        pointTypeId: product.pointTypeId,
      });

      const pointType = await this.deps.pointTypeUseCase.requireAvailableById(
        product.pointTypeId,
        tx,
      );

      if (product.status !== 'active') {
        throw new ProductUnavailableError();
      }

      const order = await this.deps.orderRepo.create(tx, {
        orderNo: this.createOrderNo(),
        userId,
        productId: product.id,
        productNameSnapshot: product.name,
        pointTypeId: product.pointTypeId,
        pointTypeNameSnapshot: pointType.name,
        price: product.price,
        deliveryTypeSnapshot: product.deliveryType,
        status: product.deliveryType === 'automatic' ? 'completed' : 'pending',
        receiverPhoneEncrypted: user.phoneEncrypted,
        receiverAddressEncrypted: user.addressEncrypted,
        idempotencyKey: `order:create:${orderData.nonce}`,
        userRemark: orderData.remark,
        completedAt: product.deliveryType === 'automatic' ? new Date() : undefined,
      });

      if (!order) {
        throw new OrderNotFoundError('订单创建失败');
      }

      const point = await this.deps.pointBalanceUseCase.changeBalance(tx, account, {
        type: 'consume',
        userId,
        pointTypeId: product.pointTypeId,
        delta: -product.price,
        sourceType: POINT_CHANGE_SOURCE_TYPE.OrderConsume,
        sourceId: order.id,
        idempotencyKey: `order:${order.id}:points:consume`,
        remark: `兑换商品：${product.name}`,
        metadata: {
          orderId: order.id,
          orderNo: order.orderNo,
          productId: product.id,
        },
      });

      await this.deps.productUseCase.changeStock(tx, product, {
        type: 'consume',
        productId: product.id,
        delta: -1,
        sourceType: STOCK_MOVEMENT_SOURCE_TYPE.consume,
        sourceId: order.id,
        idempotencyKey: `order:${order.id}:stock:consume`,
        remark: `兑换商品：${product.name}`,
        metadata: {
          orderId: order.id,
          orderNo: order.orderNo,
          userId,
        },
      });

      const updateOrder = await this.deps.orderRepo.update(
        order.id,
        {
          consumeTransactionId: point.transaction.id,
        },
        tx,
      );

      if (!updateOrder) {
        throw new OrderUpdateFailedError();
      }

      return updateOrder;
    });
  }

  async complete(id: string) {
    const order = await this.get(id);

    if (order.status !== 'pending') {
      throw new OrderStatusInvalidError('只有待完成订单可以完成');
    }

    const updateOrder = await this.deps.orderRepo.update(id, {
      status: 'completed',
      completedAt: new Date(),
    });

    if (!updateOrder) {
      throw new OrderUpdateFailedError();
    }

    return updateOrder;
  }

  async refund(id: string, refundData: RefundOrderBody) {
    return this.deps.db.transaction(async tx => {
      const order = await this.deps.orderRepo.findById(id, tx);

      if (!order) {
        throw new OrderNotFoundError();
      }

      if (order.status !== 'pending' && order.status !== 'completed') {
        throw new OrderStatusInvalidError('只有待完成或已完成订单可以退款');
      }

      const product = await this.deps.productUseCase.requireByIdForUpdate(tx, order.productId);

      // 确保账户存在并锁行
      const account = await this.deps.pointAccountRepo.ensureAccountAndLock(tx, {
        userId: order.userId,
        pointTypeId: order.pointTypeId,
      });

      const point = await this.deps.pointBalanceUseCase.changeBalance(tx, account, {
        type: 'refund',
        userId: order.userId,
        pointTypeId: order.pointTypeId,
        delta: order.price,
        sourceType: POINT_CHANGE_SOURCE_TYPE.OrderRefund,
        sourceId: order.id,
        idempotencyKey: `order:${order.id}:points:refund`,
        remark: `订单退款：${order.productNameSnapshot}`,
        metadata: {
          orderId: order.id,
          orderNo: order.orderNo,
          productId: order.productId,
          refundReason: refundData.reason,
        },
      });

      await this.deps.productUseCase.changeStock(tx, product, {
        type: 'restore',
        productId: order.productId,
        delta: 1,
        sourceType: STOCK_MOVEMENT_SOURCE_TYPE.restore,
        sourceId: order.id,
        idempotencyKey: `order:${order.id}:stock:restore`,
        remark: `订单退款恢复库存：${order.productNameSnapshot}`,
        metadata: {
          orderId: order.id,
          orderNo: order.orderNo,
          userId: order.userId,
          refundReason: refundData.reason,
        },
      });

      const updateOrder = await this.deps.orderRepo.update(
        id,
        {
          status: 'refunded',
          refundReason: refundData.reason,
          refundTransactionId: point.transaction.id,
          refundedAt: new Date(),
        },
        tx,
      );

      if (!updateOrder) {
        throw new OrderUpdateFailedError();
      }

      return updateOrder;
    });
  }

  private pad(value: number, length = 2) {
    return value.toString().padStart(length, '0');
  }
  private createOrderNo() {
    const date = new Date();

    const timestamp = [
      date.getFullYear(),
      this.pad(date.getMonth() + 1),
      this.pad(date.getDate()),
      this.pad(date.getHours()),
      this.pad(date.getMinutes()),
      this.pad(date.getSeconds()),
      this.pad(date.getMilliseconds(), 3),
    ].join('');

    const random = crypto.randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase();

    return `ORD${timestamp}${random}`;
  }
}
