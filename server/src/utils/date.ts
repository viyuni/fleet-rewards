export function toDate(value: number | null | undefined) {
  if (value === null || value === undefined) return value;

  return new Date(value);
}
