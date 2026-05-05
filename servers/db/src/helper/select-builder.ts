import type { SQL } from 'drizzle-orm';
import type { AnyPgTable, SelectedFields } from 'drizzle-orm/pg-core';

import type { DbExecutor } from '..';
import type { TableSelectFields } from './types';

export class SelectBuilder<TTable extends AnyPgTable> {
  private whereValue?: SQL;
  private orderByValues: SQL[] = [];
  private limitValue?: number;
  private offsetValue?: number;

  constructor(
    private readonly db: DbExecutor,
    private readonly table: TTable,
  ) {}

  where(value: SQL | undefined) {
    this.whereValue = value;
    return this;
  }

  orderBy(...values: SQL[]) {
    this.orderByValues = values;
    return this;
  }

  limit(value: number | undefined) {
    this.limitValue = value;
    return this;
  }

  offset(value: number | undefined) {
    this.offsetValue = value;
    return this;
  }

  columns<const TFields extends SelectedFields>(
    fields: TFields & TableSelectFields<TTable, TFields>,
  ) {
    let query = this.db
      .select(fields)
      .from(this.table as any)
      .$dynamic();

    if (this.whereValue) {
      query = query.where(this.whereValue);
    }

    if (this.orderByValues.length > 0) {
      query = query.orderBy(...this.orderByValues);
    }

    if (this.limitValue !== undefined) {
      query = query.limit(this.limitValue);
    }

    if (this.offsetValue !== undefined) {
      query = query.offset(this.offsetValue);
    }

    return query;
  }
}
