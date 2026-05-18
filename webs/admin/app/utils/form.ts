export function optionalText(value: string) {
  const trimmed = value.trim();

  return trimmed || undefined;
}

export function normalizeNullableBody<T extends Record<string, unknown>>(obj: T) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, value === undefined ? null : value]),
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
