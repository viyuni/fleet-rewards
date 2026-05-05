import { afterAll, describe, expect, it } from 'bun:test';

import { createDatabase, type DbClient } from '@server/db';
import {
  orders,
  pointAccounts,
  pointTransactions,
  pointTypes,
  products,
  productStockMovements,
  users,
} from '@server/db/schema';
import { eq } from 'drizzle-orm';

import { OrderUseCase } from '../usecase';

const testDatabaseUrl = Bun.env.TEST_DATABASE_URL;
const describeWithDatabase = testDatabaseUrl ? describe : describe.skip;

const db = testDatabaseUrl ? createDatabase(testDatabaseUrl) : undefined;

async function createOrderFixture() {
  if (!db) {
    throw new Error('TEST_DATABASE_URL 未配置');
  }

  const id = crypto.randomUUID();
  const userId = crypto.randomUUID();
  const pointTypeId = crypto.randomUUID();
  const productId = crypto.randomUUID();

  await db.transaction(async tx => {
    await tx.insert(users).values({
      id: userId,
      biliUid: `order_user_${id}`,
      username: `order_user_${id}`,
      passwordHash: 'hashed-password',
      phoneEncrypted: `phone:${id}`,
      addressEncrypted: `address:${id}`,
    });

    await tx.insert(pointTypes).values({
      id: pointTypeId,
      name: `订单积分 ${id}`,
    });

    await tx.insert(pointAccounts).values({
      userId,
      pointTypeId,
      balance: 100,
    });

    await tx.insert(products).values({
      id: productId,
      name: `订单商品 ${id}`,
      pointTypeId,
      price: 100,
      stock: 2,
      status: 'active',
      deliveryType: 'manual',
    });
  });

  return { id, userId, pointTypeId, productId };
}

async function cleanupFixture(input: Awaited<ReturnType<typeof createOrderFixture>>) {
  if (!db) {
    return;
  }

  await db
    .delete(productStockMovements)
    .where(eq(productStockMovements.productId, input.productId));
  await db.delete(pointTransactions).where(eq(pointTransactions.userId, input.userId));
  await db.delete(orders).where(eq(orders.userId, input.userId));
  await db.delete(pointAccounts).where(eq(pointAccounts.userId, input.userId));
  await db.delete(products).where(eq(products.id, input.productId));
  await db.delete(pointTypes).where(eq(pointTypes.id, input.pointTypeId));
  await db.delete(users).where(eq(users.id, input.userId));
}

afterAll(async () => {
  await db?.$client?.end();
});

describeWithDatabase('订单 UseCase', () => {
  it('创建订单时使用用户收货信息快照并扣减积分和库存', async () => {
    if (!db) {
      throw new Error('TEST_DATABASE_URL 未配置');
    }

    const fixture = await createOrderFixture();

    try {
      const useCase = new OrderUseCase(db as DbClient);
      const order = await useCase.create(fixture.userId, {
        productId: fixture.productId,
        requestId: crypto.randomUUID(),
        userRemark: '尽快处理',
      });

      const [account] = await db
        .select()
        .from(pointAccounts)
        .where(eq(pointAccounts.userId, fixture.userId));
      const [product] = await db.select().from(products).where(eq(products.id, fixture.productId));
      const movements = await db
        .select()
        .from(productStockMovements)
        .where(eq(productStockMovements.productId, fixture.productId));

      expect(order?.userId).toBe(fixture.userId);
      expect(order?.status).toBe('pending');
      expect(order?.receiverPhoneEncrypted).toBe(`phone:${fixture.id}`);
      expect(order?.receiverAddressEncrypted).toBe(`address:${fixture.id}`);
      expect(typeof order?.consumeTransactionId).toBe('string');
      expect(account?.balance).toBe(0);
      expect(product?.stock).toBe(1);
      expect(movements).toHaveLength(1);
      expect(movements[0]?.type).toBe('consume');
      expect(movements[0]?.delta).toBe(-1);
      expect(movements[0]?.stockBefore).toBe(2);
      expect(movements[0]?.stockAfter).toBe(1);
    } finally {
      await cleanupFixture(fixture);
    }
  });
});
