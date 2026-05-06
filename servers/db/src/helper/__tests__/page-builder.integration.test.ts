import { afterAll, beforeAll, describe, expect, it } from 'bun:test';

import { createDatabase, type DbClient } from '@server/db';
import { PageBuilder, QueryPageBuilder } from '@server/db/helper';
import { pointTypes } from '@server/db/schema';
import { and, asc, eq, like } from 'drizzle-orm';

const testDatabaseUrl = Bun.env.TEST_DATABASE_URL;
const describeWithDatabase = testDatabaseUrl ? describe : describe.skip;

let db: DbClient;
const batches: string[] = [];

beforeAll(async () => {
  if (!testDatabaseUrl) return;
  db = createDatabase(testDatabaseUrl);
});

afterAll(async () => {
  if (!db) return;
  for (const batch of batches) {
    await db.delete(pointTypes).where(like(pointTypes.name, `${batch}%`));
  }
});

function newBatch() {
  const batch = `pb_test_${crypto.randomUUID().slice(0, 8)}`;
  batches.push(batch);
  return batch;
}

async function seed(batch: string, count: number, status: 'active' | 'disabled' = 'active') {
  const values = Array.from({ length: count }, (_, i) => ({
    name: `${batch}_${i}_${crypto.randomUUID().slice(0, 8)}`,
    status,
    sort: count - i,
  }));

  await db.insert(pointTypes).values(values).onConflictDoNothing();
}

describeWithDatabase('PageBuilder 真实数据库', () => {
  it('分页查询返回正确的 meta', async () => {
    const batch = newBatch();
    await seed(batch, 5);

    const result = await new PageBuilder(db, pointTypes)
      .page(1)
      .pageSize(3)
      .where(like(pointTypes.name, `${batch}%`))
      .orderBy(asc(pointTypes.sort))
      .paginate();

    expect(result.items.length).toBe(3);
    expect(result.meta.pageSize).toBe(3);
    expect(result.meta.total).toBe(5);
    expect(result.meta.page).toBe(1);
    expect(result.meta.hasNextPage).toBe(true);
    expect(result.meta.hasPrevPage).toBe(false);
  });

  it('第二页数据不与第一页重叠', async () => {
    const batch = newBatch();
    await seed(batch, 6);

    const where = like(pointTypes.name, `${batch}%`);

    const page1 = await new PageBuilder(db, pointTypes)
      .page(1)
      .pageSize(3)
      .where(where)
      .orderBy(asc(pointTypes.sort))
      .paginate();

    const page2 = await new PageBuilder(db, pointTypes)
      .page(2)
      .pageSize(3)
      .where(where)
      .orderBy(asc(pointTypes.sort))
      .paginate();

    const page1Ids = new Set(page1.items.map(item => item.id));
    const overlap = page2.items.filter(item => page1Ids.has(item.id));

    expect(overlap.length).toBe(0);
    expect(page1.meta.total).toBe(6);
    expect(page2.meta.total).toBe(6);
  });

  it('where 条件过滤数据', async () => {
    const batch = newBatch();
    await seed(batch, 3, 'active');
    await seed(batch, 2, 'disabled');

    const result = await new PageBuilder(db, pointTypes)
      .page(1)
      .pageSize(100)
      .where(and(like(pointTypes.name, `${batch}%`), eq(pointTypes.status, 'disabled')))
      .paginate();

    expect(result.items.every(item => item.status === 'disabled')).toBe(true);
    expect(result.items.length).toBe(2);
  });

  it('orderBy 排序生效', async () => {
    const batch = newBatch();
    await seed(batch, 4);

    const result = await new PageBuilder(db, pointTypes)
      .page(1)
      .pageSize(100)
      .where(like(pointTypes.name, `${batch}%`))
      .orderBy(asc(pointTypes.sort))
      .paginate();

    const sorts = result.items.map(item => item.sort);
    const sorted = [...sorts].sort((a, b) => a - b);
    expect(sorts).toEqual(sorted);
  });

  it('选择部分字段', async () => {
    const batch = newBatch();
    await seed(batch, 1);

    const result = await new PageBuilder(db, pointTypes)
      .page(1)
      .pageSize(10)
      .where(like(pointTypes.name, `${batch}%`))
      .columns({ name: pointTypes.name })
      .paginate();

    expect(result.items.length).toBeGreaterThanOrEqual(1);
    expect(Object.keys(result.items?.[0] ?? {}).sort()).toEqual(['name']);
  });

  it('pageSize 超过 maxPageSize 时被截断', async () => {
    const batch = newBatch();
    await seed(batch, 3);

    const result = await new PageBuilder(db, pointTypes)
      .page(1)
      .pageSize(200)
      .maxPageSize(2)
      .where(like(pointTypes.name, `${batch}%`))
      .paginate();

    expect(result.meta.pageSize).toBe(2);
    expect(result.items.length).toBeLessThanOrEqual(2);
  });
});

describeWithDatabase('QueryPageBuilder 真实数据库', () => {
  it('分页查询返回正确的 meta', async () => {
    const batch = newBatch();
    await seed(batch, 5);

    const result = await new QueryPageBuilder(db, pointTypes, db.query.pointTypes)
      .page(1)
      .pageSize(3)
      .where({ name: { like: `${batch}%` } })
      .orderBy({ sort: 'asc' })
      .paginate();

    expect(result.items.length).toBe(3);
    expect(result.meta.pageSize).toBe(3);
    expect(result.meta.total).toBe(5);
    expect(result.meta.page).toBe(1);
    expect(result.meta.hasNextPage).toBe(true);
    expect(result.meta.hasPrevPage).toBe(false);
  });

  it('第二页数据不与第一页重叠', async () => {
    const batch = newBatch();
    await seed(batch, 6);

    const where = { name: { like: `${batch}%` } };

    const page1 = await new QueryPageBuilder(db, pointTypes, db.query.pointTypes)
      .page(1)
      .pageSize(3)
      .where(where)
      .orderBy({ sort: 'asc' })
      .paginate();

    const page2 = await new QueryPageBuilder(db, pointTypes, db.query.pointTypes)
      .page(2)
      .pageSize(3)
      .where(where)
      .orderBy({ sort: 'asc' })
      .paginate();

    const page1Ids = new Set(page1.items.map(item => item.id));
    const overlap = page2.items.filter(item => page1Ids.has(item.id));

    expect(overlap.length).toBe(0);
    expect(page1.meta.total).toBe(6);
    expect(page2.meta.total).toBe(6);
  });

  it('where 条件过滤数据', async () => {
    const batch = newBatch();
    await seed(batch, 3, 'active');
    await seed(batch, 2, 'disabled');

    const result = await new QueryPageBuilder(db, pointTypes, db.query.pointTypes)
      .page(1)
      .pageSize(100)
      .where({ name: { like: `${batch}%` }, status: 'disabled' })
      .paginate();

    expect(result.items.every(item => item.status === 'disabled')).toBe(true);
    expect(result.items.length).toBe(2);
  });

  it('orderBy 排序生效', async () => {
    const batch = newBatch();
    await seed(batch, 4);

    const result = await new QueryPageBuilder(db, pointTypes, db.query.pointTypes)
      .page(1)
      .pageSize(100)
      .where({ name: { like: `${batch}%` } })
      .orderBy({ sort: 'asc' })
      .paginate();

    const sorts = result.items.map(item => item.sort);
    const sorted = [...sorts].sort((a, b) => a - b);
    expect(sorts).toEqual(sorted);
  });

  it('选择部分字段', async () => {
    const batch = newBatch();
    await seed(batch, 1);

    const result = await new QueryPageBuilder(db, pointTypes, db.query.pointTypes)
      .page(1)
      .pageSize(10)
      .where({ name: { like: `${batch}%` } })
      .columns({ name: true })
      .paginate();

    expect(result.items.length).toBeGreaterThanOrEqual(1);
    expect(Object.keys(result.items?.[0] ?? {}).sort()).toEqual(['name']);
  });

  it('pageSize 超过 maxPageSize 时被截断', async () => {
    const batch = newBatch();
    await seed(batch, 3);

    const result = await new QueryPageBuilder(db, pointTypes, db.query.pointTypes)
      .page(1)
      .pageSize(200)
      .maxPageSize(2)
      .where({ name: { like: `${batch}%` } })
      .orderBy({ createdAt: 'desc' })
      .paginate();

    expect(result.meta.pageSize).toBe(2);
    expect(result.items.length).toBeLessThanOrEqual(2);
  });
});
