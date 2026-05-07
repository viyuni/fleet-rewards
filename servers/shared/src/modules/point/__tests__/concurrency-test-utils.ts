import { afterEach, beforeEach, describe, expect } from 'bun:test';

import { createDatabase, type DbClient } from '@server/db';
import {
  orders,
  pointAccounts,
  pointConversionRules,
  pointTransactions,
  pointTypes,
  products,
  productStockMovements,
  users,
} from '@server/db/schema';
import { and, inArray, like } from 'drizzle-orm';

import { createAppInstances } from '../../../context';

const testDatabaseUrl = Bun.env.DATABASE_URL;
const batches = new Set<string>();

export const describeWithDatabase = testDatabaseUrl ? describe : describe.skip;

export let db: DbClient;

export function installConcurrencyTestHooks() {
  beforeEach(() => {
    if (!testDatabaseUrl) return;
    db = createDatabase(testDatabaseUrl);
  });

  afterEach(async () => {
    if (!db) return;

    try {
      for (const batch of batches) {
        await cleanupBatch(batch);
      }
    } finally {
      batches.clear();
      await db.$client.end();
    }
  });
}

export function newBatch() {
  const batch = `shared_concurrency_${crypto.randomUUID().slice(0, 8)}`;
  batches.add(batch);
  return batch;
}

export function expectSeeded<T>(value: T | null | undefined, message: string): T {
  if (!value) throw new Error(message);
  return value;
}

export async function expectRejectsInstanceOf<T extends Error>(
  promise: Promise<unknown>,
  errorType: new (...args: never[]) => T,
) {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(errorType);
    return;
  }

  throw new Error(`expected promise to reject with ${errorType.name}`);
}

export function createDeps() {
  const { repositories, useCases } = createAppInstances({
    db,
    config: {
      DATABASE_URL: testDatabaseUrl ?? '',
      NODE_ENV: 'test',
      LOG_LEVEL: 'error',
      IMAGE_SAVE_PATH: '',
      JWT_SECRET: 'test',
      DATA_SECRET: 'test',
    },
  });

  return {
    ...repositories,
    ...useCases,
  };
}

export async function seedPointType(name: string) {
  const pointType = await createDeps().pointTypeUseCase.create({
    name,
  });

  return expectSeeded(pointType, 'seed point type failed');
}

export async function seedUser(name: string) {
  const biliUid = `${Date.now()}${Math.floor(Math.random() * 100_000_000)}` as `${number}`;
  const created = await createDeps().userUseCase.create({
    biliUid,
    username: name,
    password: 'test_password',
  });
  const user = await db.query.users.findFirst({ where: { id: created.id } });

  return expectSeeded(user, 'seed user failed');
}

export async function seedProduct(input: {
  name: string;
  pointTypeId: string;
  price: number;
  stock: number;
}) {
  const { productUseCase } = createDeps();
  const product = expectSeeded(
    await productUseCase.create({
      ...input,
    }),
    'seed product failed',
  );

  return expectSeeded(await productUseCase.active(product.id), 'seed product failed');
}

export async function seedConversionFixture(
  prefix: string,
  overrides: Record<string, unknown> = {},
) {
  const fromPointType = await seedPointType(`${prefix}_from_point`);
  const toPointType = await seedPointType(`${prefix}_to_point`);
  const user = await seedUser(`${prefix}_conversion_user`);
  const rule = await createDeps().pointConversionUseCase.create({
    name: `${prefix}_conversion_rule`,
    fromPointTypeId: fromPointType.id,
    toPointTypeId: toPointType.id,
    fromAmount: 2,
    toAmount: 10,
    enabled: true,
    ...overrides,
  } as never);

  return {
    fromPointType,
    rule: expectSeeded(rule, 'seed conversion rule failed'),
    toPointType,
    user,
  };
}

export async function createConversionRule(
  prefix: string,
  fromPointTypeId: string,
  toPointTypeId: string,
  overrides: Record<string, unknown> = {},
) {
  const rule = await createDeps().pointConversionUseCase.create({
    name: `${prefix}_conversion_rule`,
    fromPointTypeId,
    toPointTypeId,
    fromAmount: 1,
    toAmount: 10,
    enabled: true,
    ...overrides,
  } as never);

  return expectSeeded(rule, 'seed conversion rule failed');
}

export async function grantPoints(input: {
  adminId: string;
  userId: string;
  pointTypeId: string;
  delta: number;
  nonce: string;
}) {
  return createDeps().pointAccountUseCase.adjustBalance(input.adminId, {
    userId: input.userId,
    pointTypeId: input.pointTypeId,
    delta: input.delta,
    nonce: input.nonce,
  });
}

async function cleanupBatch(batch: string) {
  const batchUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(like(users.username, `${batch}%`));
  const userIds = batchUsers.map(user => user.id);

  const batchPointTypes = await db
    .select({ id: pointTypes.id })
    .from(pointTypes)
    .where(like(pointTypes.name, `${batch}%`));
  const pointTypeIds = batchPointTypes.map(pointType => pointType.id);

  const batchProducts = await db
    .select({ id: products.id })
    .from(products)
    .where(like(products.name, `${batch}%`));
  const productIds = batchProducts.map(product => product.id);

  if (userIds.length > 0) {
    await db.delete(orders).where(inArray(orders.userId, userIds));
  }

  if (productIds.length > 0) {
    await db
      .delete(productStockMovements)
      .where(inArray(productStockMovements.productId, productIds));
  }

  if (userIds.length > 0) {
    await db.delete(pointTransactions).where(inArray(pointTransactions.userId, userIds));
    await db.delete(pointAccounts).where(inArray(pointAccounts.userId, userIds));
    await db.delete(users).where(inArray(users.id, userIds));
  }

  if (pointTypeIds.length > 0) {
    await db
      .delete(pointConversionRules)
      .where(
        and(
          inArray(pointConversionRules.fromPointTypeId, pointTypeIds),
          inArray(pointConversionRules.toPointTypeId, pointTypeIds),
        ),
      );
  }

  if (productIds.length > 0) {
    await db.delete(products).where(inArray(products.id, productIds));
  }

  if (pointTypeIds.length > 0) {
    await db.delete(pointTypes).where(inArray(pointTypes.id, pointTypeIds));
  }
}
