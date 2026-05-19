/**
 * Update payload convention:
 * - `undefined` / missing means "do not change this field".
 * - `null` means "clear this nullable field".
 * - `''` from form controls is normalized to `null` at the submit boundary.
 */
export function nullifyEmptyFields<T extends Record<string, unknown>>(obj: T) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, value === '' ? null : value]),
  ) as T;
}

/**
 * Create payload convention:
 * Empty optional fields are omitted so backend defaults can apply.
 */
export function dropEmptyFields<T extends Record<string, unknown>>(obj: T) {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    ),
  ) as T;
}

export function toDatetimeLocalValue(value: Date | string | number | null | undefined) {
  if (!value) {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);

  return local.toISOString().slice(0, 19);
}

export function fromDatetimeLocalValue(value: string) {
  return value ? new Date(value).getTime() : undefined;
}
