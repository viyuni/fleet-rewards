export * from './query-helpers';
export * from './select-builder';
export * from './page-builder';

export function parseDate(value: number | undefined | null) {
  return value ? new Date(value) : undefined;
}
