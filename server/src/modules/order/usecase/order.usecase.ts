import type {
  CreateOrderBody,
  OrderPageQuery,
  RefundOrderBody,
  UpdateOrderExpressBody,
} from '@internal/shared/order';

import type { DbClient } from '#db';
import {
  POINT_CHANGE_SOURCE_TYPE,
  PointIdempotencyKey,
  PointAccountRepository,
  PointBalanceUseCase,
  PointTypeUseCase,
} from '#modules/point';
import { ProductPolicy, ProductUseCase, STOCK_MOVEMENT_SOURCE_TYPE } from '#modules/product';
import { StockIdempotencyKey } from '#modules/product';
import { UserUseCase } from '#modules/user';
import { publishOrderCreated, type NewOrderEmailInput } from '#queues';

import {
  OrderNo,
  OrderIdempotencyKey,
  OrderNotFoundError,
  OrderPolicy,
  OrderUpdateFailedError,
} from '../domain';
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

  async get(orderId: string) {
    const order = await this.deps.orderRepo.findById(orderId);

    if (!order) {
      throw new OrderNotFoundError();
    }

    return order;
  }

  async create(userId: string, orderData: CreateOrderBody) {
    const { order, newOrderEmail } = await this.deps.db.transaction(async tx => {
      const user = await this.deps.userUseCase.getAvailableById(userId, tx);
      const product = await this.deps.productUseCase.requireByIdForUpdate(tx, orderData.productId);

      // 确保账户存在并锁行
      const account = await this.deps.pointAccountRepo.ensureAccountAndLock(tx, {
        userId: user.id,
        pointTypeId: product.pointTypeId,
      });

      const pointType = await this.deps.pointTypeUseCase.getAvailableById(product.pointTypeId, tx);

      ProductPolicy.assertAvailable(product);

      const order = await this.deps.orderRepo.create(tx, {
        orderNo: OrderNo.create(),
        userId,
        productId: product.id,
        productNameSnapshot: product.name,
        pointTypeId: product.pointTypeId,
        pointTypeNameSnapshot: pointType.name,
        price: product.price,
        deliveryTypeSnapshot: product.deliveryType,
        status: OrderPolicy.initialStatusForDeliveryType(product.deliveryType),
        receiverPhoneEncrypted: user.phoneEncrypted,
        receiverAddressEncrypted: user.addressEncrypted,
        idempotencyKey: OrderIdempotencyKey.create({ nonce: orderData.nonce }),
        userRemark: orderData.remark,
        completedAt: OrderPolicy.completedAtForDeliveryType(product.deliveryType),
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
        idempotencyKey: PointIdempotencyKey.orderConsume({ orderId: order.id }),
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
        idempotencyKey: StockIdempotencyKey.orderConsume({ orderId: order.id }),
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

      return {
        order: updateOrder,
        newOrderEmail: {
          orderNo: updateOrder.orderNo,
          username: user.username,
          biliUid: user.biliUid,
          productName: updateOrder.productNameSnapshot,
          pointTypeName: updateOrder.pointTypeNameSnapshot,
          price: updateOrder.price,
          deliveryType: updateOrder.deliveryTypeSnapshot,
          status: updateOrder.status,
          createdAt: updateOrder.createdAt,
          userRemark: updateOrder.userRemark,
        } satisfies NewOrderEmailInput,
      };
    });

    await publishOrderCreated(newOrderEmail);

    return order;
  }

  async complete(orderId: string) {
    const order = await this.get(orderId);

    OrderPolicy.assertCanComplete(order);

    const updateOrder = await this.deps.orderRepo.update(orderId, {
      status: 'completed',
      completedAt: new Date(),
    });

    if (!updateOrder) {
      throw new OrderUpdateFailedError();
    }

    return updateOrder;
  }

  async refund(orderId: string, refundData: RefundOrderBody) {
    return this.deps.db.transaction(async tx => {
      const order = await this.deps.orderRepo.findById(orderId, tx);

      if (!order) {
        throw new OrderNotFoundError();
      }

      OrderPolicy.assertCanRefund(order);

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
        idempotencyKey: PointIdempotencyKey.orderRefund({ orderId: order.id }),
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
        idempotencyKey: StockIdempotencyKey.orderRestore({ orderId: order.id }),
        remark: `订单退款恢复库存：${order.productNameSnapshot}`,
        metadata: {
          orderId: order.id,
          orderNo: order.orderNo,
          userId: order.userId,
          refundReason: refundData.reason,
        },
      });

      const updateOrder = await this.deps.orderRepo.update(
        orderId,
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

  async updateExpress(orderId: string, expressData: UpdateOrderExpressBody) {
    await this.get(orderId);

    const updateOrder = await this.deps.orderRepo.update(orderId, {
      expressCompany: expressData.expressCompany,
      expressNo: expressData.expressNo,
    });

    if (!updateOrder) {
      throw new OrderUpdateFailedError('订单快递信息更新失败');
    }

    return updateOrder;
  }

  /**
   * 管理员 - 订单列表
   */
  pageManage(query: OrderPageQuery) {
    return this.deps.orderRepo.pageManage(query);
  }

  /**
   * 用户订单列表
   */
  pageMine(query: OrderPageQuery) {
    return this.deps.orderRepo.pageMine(query);
  }
}
