import { getColumns } from 'drizzle-orm';
import type { AnyPgTable } from 'drizzle-orm/pg-core';

export * from './query-helpers';
export * from './page-builder';

export function parseDate(value: number | string | null | undefined) {
  if (value === null || value === undefined) return value;
  if (value === '') return null;

  return new Date(value);
}

export function defineSelectColumns<
  TTable extends AnyPgTable,
  const TColumns extends Partial<TTable['_']['columns']>,
>(table: TTable, factory: (columns: TTable['_']['columns']) => TColumns) {
  return factory(getColumns(table));
}
