import { describe, expect, it, mock } from 'bun:test';

import { PageBuilder } from '../page-builder';

function createMockDb(items: unknown[] = [], total = 0) {
  const calls: { method: string; args: unknown[] }[] = [];

  const resolve = async () => items;

  const offsetFn = mock((...args: unknown[]) => {
    calls.push({ method: 'offset', args });
    return resolve();
  });

  const limitFn = mock((...args: unknown[]) => {
    calls.push({ method: 'limit', args });
    return { offset: offsetFn };
  });

  const whereFn = mock(function (this: any, ...args: unknown[]) {
    calls.push({ method: 'where', args });
    return { ...this, orderBy: orderByFn, limit: limitFn };
  });

  const orderByFn = mock(function (this: any, ...args: unknown[]) {
    calls.push({ method: 'orderBy', args });
    return { ...this, limit: limitFn };
  });

  const dynamicFn = mock(() => ({
    where: whereFn,
    orderBy: orderByFn,
    limit: limitFn,
  }));

  const fromFn = mock(() => ({ $dynamic: dynamicFn }));

  const selectFn = mock(() => ({ from: fromFn }));

  return {
    select: selectFn,
    $count: mock(async () => total),
    _calls: calls,
    _limitFn: limitFn,
    _offsetFn: offsetFn,
  } as any;
}

const mockTable = {} as any;

describe('PageBuilder', () => {
  describe('page()', () => {
    it('null/undefined 时默认为 1', () => {
      const db = createMockDb();
      const builder = new PageBuilder(db, mockTable);

      builder.page(null).page(undefined);

      expect(builder['currentPage']).toBe(1);
    });

    it('负数钳制为 1', () => {
      const db = createMockDb();
      const builder = new PageBuilder(db, mockTable);

      builder.page(-5);

      expect(builder['currentPage']).toBe(1);
    });

    it('接受合法页码', () => {
      const db = createMockDb();
      const builder = new PageBuilder(db, mockTable);

      builder.page(3);

      expect(builder['currentPage']).toBe(3);
    });
  });

  describe('pageSize()', () => {
    it('null/undefined 时默认为 20', () => {
      const db = createMockDb();
      const builder = new PageBuilder(db, mockTable);

      builder.pageSize(null);

      expect(builder['currentPageSize']).toBe(20);
    });

    it('小于 1 钳制为 1', () => {
      const db = createMockDb();
      const builder = new PageBuilder(db, mockTable);

      builder.pageSize(0);

      expect(builder['currentPageSize']).toBe(1);
    });

    it('超过 maxPageSize 时截断', () => {
      const db = createMockDb();
      const builder = new PageBuilder(db, mockTable);

      builder.pageSize(200);

      expect(builder['currentPageSize']).toBe(100);
    });

    it('尊重自定义 maxPageSize', () => {
      const db = createMockDb();
      const builder = new PageBuilder(db, mockTable);

      builder.maxPageSize(50).pageSize(80);

      expect(builder['currentPageSize']).toBe(50);
    });
  });

  describe('maxPageSize()', () => {
    it('null/undefined 时默认为 100', () => {
      const db = createMockDb();
      const builder = new PageBuilder(db, mockTable);

      builder.maxPageSize(null);

      expect(builder['currentMaxPageSize']).toBe(100);
    });

    it('小于 1 钳制为 1', () => {
      const db = createMockDb();
      const builder = new PageBuilder(db, mockTable);

      builder.maxPageSize(-10);

      expect(builder['currentMaxPageSize']).toBe(1);
    });

    it('缩小已设 pageSize 使其不超过新 max', () => {
      const db = createMockDb();
      const builder = new PageBuilder(db, mockTable);

      builder.pageSize(50).maxPageSize(30);

      expect(builder['currentMaxPageSize']).toBe(30);
      expect(builder['currentPageSize']).toBe(30);
    });
  });

  describe('paginate()', () => {
    it('返回正确的分页数据和 meta', async () => {
      const items = [{ id: 1 }, { id: 2 }];
      const db = createMockDb(items, 25);

      const result = await new PageBuilder(db, mockTable).page(2).pageSize(10).paginate();

      expect(result.items).toEqual(items);
      expect(result.meta).toEqual({
        page: 2,
        pageSize: 10,
        total: 25,
        totalPages: 3,
        hasNextPage: true,
        hasPrevPage: true,
      });
    });

    it('最后一页 hasNextPage=false', async () => {
      const db = createMockDb([], 20);

      const result = await new PageBuilder(db, mockTable).page(2).pageSize(10).paginate();

      expect(result.meta.hasNextPage).toBe(false);
    });

    it('第一页 hasPrevPage=false', async () => {
      const db = createMockDb([], 20);

      const result = await new PageBuilder(db, mockTable).page(1).pageSize(10).paginate();

      expect(result.meta.hasPrevPage).toBe(false);
    });

    it('total 为 0 时的处理', async () => {
      const db = createMockDb([], 0);

      const result = await new PageBuilder(db, mockTable).paginate();

      expect(result.meta.totalPages).toBe(0);
      expect(result.meta.hasNextPage).toBe(false);
      expect(result.meta.hasPrevPage).toBe(false);
    });

    it('传递 where 条件到查询', async () => {
      const db = createMockDb([], 0);
      const whereSQL = {} as any;

      await new PageBuilder(db, mockTable).where(whereSQL).paginate();

      const whereCall = db._calls.find((c: any) => c.method === 'where');
      expect(whereCall).toBeDefined();
      expect(whereCall!.args[0]).toBe(whereSQL);
    });

    it('where 为 undefined 时不调用', async () => {
      const db = createMockDb([], 0);

      await new PageBuilder(db, mockTable).where(undefined).paginate();

      const whereCall = db._calls.find((c: any) => c.method === 'where');
      expect(whereCall).toBeUndefined();
    });

    it('传递 orderBy 到查询', async () => {
      const db = createMockDb([], 0);
      const orderSQL = [{} as any, {} as any];

      await new PageBuilder(db, mockTable).orderBy(...orderSQL).paginate();

      const orderByCall = db._calls.find((c: any) => c.method === 'orderBy');
      expect(orderByCall).toBeDefined();
      expect(orderByCall!.args).toEqual(orderSQL);
    });

    it('根据 page 和 pageSize 计算正确的 offset', async () => {
      const db = createMockDb([], 0);

      await new PageBuilder(db, mockTable).page(3).pageSize(5).paginate();

      expect(db._limitFn).toHaveBeenCalledWith(5);
      expect(db._offsetFn).toHaveBeenCalledWith(10);
    });

    it('用 table 和 where 调用 $count', async () => {
      const db = createMockDb([], 0);
      const whereSQL = {} as any;

      await new PageBuilder(db, mockTable).where(whereSQL).paginate();

      expect(db.$count).toHaveBeenCalledWith(mockTable, whereSQL);
    });
  });

  describe('chaining', () => {
    it('所有方法可链式调用', async () => {
      const db = createMockDb([], 0);

      const result = await new PageBuilder(db, mockTable)
        .page(2)
        .pageSize(5)
        .maxPageSize(50)
        .where(undefined)
        .orderBy()
        .paginate();

      expect(result.meta.page).toBe(2);
      expect(result.meta.pageSize).toBe(5);
    });
  });
});
