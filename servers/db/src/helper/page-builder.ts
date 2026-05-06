import { type InferSelectModel, relationsFilterToSQL, type SQL } from 'drizzle-orm';
import type { AnyPgTable, SelectedFields } from 'drizzle-orm/pg-core';
import type { SelectResultFields } from 'drizzle-orm/query-builders/select.types';

import type { DbExecutor } from '..';
import type { TableSelectFields } from './types';

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type PaginatedResult<TItem> = {
  items: TItem[];
  meta: PaginationMeta;
};

type PageItem<
  TTable extends AnyPgTable,
  TFields extends SelectedFields | undefined,
> = TFields extends SelectedFields ? SelectResultFields<TFields> : InferSelectModel<TTable>;

export class PageBuilder<
  TTable extends AnyPgTable,
  TFields extends SelectedFields | undefined = undefined,
> {
  private static readonly DEFAULT_PAGE = 1;
  private static readonly DEFAULT_PAGE_SIZE = 20;
  private static readonly DEFAULT_MAX_PAGE_SIZE = 100;

  private whereValue?: SQL;
  private orderByValues: SQL[] = [];

  private currentPage = PageBuilder.DEFAULT_PAGE;
  private currentPageSize = PageBuilder.DEFAULT_PAGE_SIZE;
  private currentMaxPageSize = PageBuilder.DEFAULT_MAX_PAGE_SIZE;

  private fields?: TFields;

  constructor(
    private readonly db: DbExecutor,
    private readonly table: TTable,
  ) {}

  page(page: number | undefined | null) {
    this.currentPage = Math.max(1, page ?? PageBuilder.DEFAULT_PAGE);
    return this;
  }

  pageSize(pageSize: number | undefined | null) {
    const value = pageSize ?? PageBuilder.DEFAULT_PAGE_SIZE;
    this.currentPageSize = Math.min(this.currentMaxPageSize, Math.max(1, value));
    return this;
  }

  maxPageSize(maxPageSize: number | undefined | null) {
    const value = maxPageSize ?? PageBuilder.DEFAULT_MAX_PAGE_SIZE;
    this.currentMaxPageSize = Math.max(1, value);
    this.currentPageSize = Math.min(this.currentPageSize, this.currentMaxPageSize);
    return this;
  }

  where(value: SQL | undefined) {
    this.whereValue = value;
    return this;
  }

  orderBy(...values: SQL[]) {
    this.orderByValues = values;
    return this;
  }

  columns<const TNextFields extends SelectedFields>(
    fields: TNextFields & TableSelectFields<TTable, TNextFields>,
  ): PageBuilder<TTable, TNextFields> {
    this.fields = fields as unknown as TFields;

    return this as unknown as PageBuilder<TTable, TNextFields>;
  }

  async paginate(): Promise<PaginatedResult<PageItem<TTable, TFields>>> {
    const page = this.currentPage;
    const pageSize = this.currentPageSize;

    const limit = pageSize;
    const offset = (page - 1) * pageSize;

    const table = this.table as any;

    const query = this.fields
      ? this.db
          .select(this.fields as SelectedFields)
          .from(table)
          .$dynamic()
      : this.db.select().from(table).$dynamic();

    let builtQuery = query;

    if (this.whereValue) {
      builtQuery = builtQuery.where(this.whereValue);
    }

    if (this.orderByValues.length > 0) {
      builtQuery = builtQuery.orderBy(...this.orderByValues);
    }

    const pagedQuery = builtQuery.limit(limit).offset(offset);

    const [total, items] = await Promise.all([this.db.$count(table, this.whereValue), pagedQuery]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      items,
      meta: {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    } as PaginatedResult<PageItem<TTable, TFields>>;
  }
}

type FindManyQuery = {
  findMany: (config?: any) => Promise<any[]>;
};

type FindManyConfig<TQuery extends FindManyQuery> = NonNullable<Parameters<TQuery['findMany']>[0]>;

type FindManyResult<TQuery extends FindManyQuery> = Awaited<ReturnType<TQuery['findMany']>>;

type FindManyItem<TQuery extends FindManyQuery> = FindManyResult<TQuery>[number];

type ConfigColumns<TQuery extends FindManyQuery> =
  FindManyConfig<TQuery> extends { columns?: infer TColumns } ? TColumns : never;

type ConfigWith<TQuery extends FindManyQuery> =
  FindManyConfig<TQuery> extends { with?: infer TWith } ? TWith : never;

type ConfigOrderBy<TQuery extends FindManyQuery> =
  FindManyConfig<TQuery> extends { orderBy?: infer TOrderBy } ? TOrderBy : never;

type ConfigWhere<TQuery extends FindManyQuery> =
  FindManyConfig<TQuery> extends { where?: infer TWhere } ? TWhere : never;

type SelectedColumnKeys<TColumns> = {
  [TKey in keyof TColumns]: TColumns[TKey] extends true ? TKey : never;
}[keyof TColumns];

type QueryColumnsItem<TTable extends AnyPgTable, TColumns> = Pick<
  InferSelectModel<TTable>,
  Extract<SelectedColumnKeys<TColumns>, keyof InferSelectModel<TTable>>
>;

export class QueryPageBuilder<
  TTable extends AnyPgTable,
  TQuery extends FindManyQuery,
  TItem = FindManyItem<TQuery>,
> {
  private static readonly DEFAULT_PAGE = 1;
  private static readonly DEFAULT_PAGE_SIZE = 20;
  private static readonly DEFAULT_MAX_PAGE_SIZE = 100;

  private currentPage = QueryPageBuilder.DEFAULT_PAGE;
  private currentPageSize = QueryPageBuilder.DEFAULT_PAGE_SIZE;
  private currentMaxPageSize = QueryPageBuilder.DEFAULT_MAX_PAGE_SIZE;

  private whereValue?: ConfigWhere<TQuery>;
  private columnsValue?: ConfigColumns<TQuery>;
  private withValue?: ConfigWith<TQuery>;
  private orderByValue?: ConfigOrderBy<TQuery>;

  constructor(
    private readonly db: DbExecutor,
    private readonly table: TTable,
    private readonly query: TQuery,
  ) {}

  page(page: number | undefined | null) {
    this.currentPage = Math.max(1, page ?? QueryPageBuilder.DEFAULT_PAGE);
    return this;
  }

  pageSize(pageSize: number | undefined | null) {
    const value = pageSize ?? QueryPageBuilder.DEFAULT_PAGE_SIZE;
    this.currentPageSize = Math.min(this.currentMaxPageSize, Math.max(1, value));
    return this;
  }

  maxPageSize(maxPageSize: number | undefined | null) {
    const value = maxPageSize ?? QueryPageBuilder.DEFAULT_MAX_PAGE_SIZE;
    this.currentMaxPageSize = Math.max(1, value);
    this.currentPageSize = Math.min(this.currentPageSize, this.currentMaxPageSize);
    return this;
  }

  where<const TWhere extends ConfigWhere<TQuery>>(value: TWhere | undefined) {
    this.whereValue = value;
    return this;
  }

  columns<const TColumns extends ConfigColumns<TQuery>>(
    columns: TColumns,
  ): QueryPageBuilder<TTable, TQuery, QueryColumnsItem<TTable, TColumns>> {
    this.columnsValue = columns;
    return this as unknown as QueryPageBuilder<TTable, TQuery, QueryColumnsItem<TTable, TColumns>>;
  }

  with<const TWith extends ConfigWith<TQuery>>(withValue: TWith) {
    this.withValue = withValue;
    return this;
  }

  orderBy<const TOrderBy extends ConfigOrderBy<TQuery>>(orderBy: TOrderBy) {
    this.orderByValue = orderBy;
    return this;
  }

  async paginate(): Promise<PaginatedResult<TItem>> {
    const page = this.currentPage;
    const pageSize = this.currentPageSize;

    const limit = pageSize;
    const offset = (page - 1) * pageSize;

    const config = {
      columns: this.columnsValue,
      with: this.withValue,
      orderBy: this.orderByValue,
      where: this.whereValue,
      limit,
      offset,
    } satisfies Partial<FindManyConfig<TQuery>>;

    const sqlWhere = this.whereValue
      ? relationsFilterToSQL(this.table, this.whereValue as never)
      : undefined;

    const [total, items] = await Promise.all([
      this.db.$count(this.table, sqlWhere),
      this.query.findMany(config as FindManyConfig<TQuery>),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      items,
      meta: {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    } as PaginatedResult<TItem>;
  }
}
