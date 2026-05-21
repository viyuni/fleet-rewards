export function toDatetimeLocalValue(value: Date | string | null | undefined) {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 19);
  }

  return value;
}
