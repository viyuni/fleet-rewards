import type { AnyPgTable, SelectedFields } from 'drizzle-orm/pg-core';

export type TableColumns<TTable extends AnyPgTable> = TTable['_']['columns'];

export type QueryColumns<TColumns extends Record<string, unknown>> = {
  [K in keyof TColumns]: true;
};

export type TableSelectFields<TTable extends AnyPgTable, TFields extends SelectedFields> =
  Exclude<keyof TFields, keyof TableColumns<TTable>> extends never
    ? {
        [K in keyof TFields]: K extends keyof TableColumns<TTable>
          ? TFields[K] extends TableColumns<TTable>[K]
            ? TFields[K]
            : never
          : never;
      }
    : never;
