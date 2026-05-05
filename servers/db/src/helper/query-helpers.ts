import { eq, gte, ilike, isNull, lte, or, type AnyColumn, type SQL } from 'drizzle-orm';

/**
 * 删除时间字段为 null 的过滤条件
 */
export function deletedAtIsNull<T extends { deletedAt: any }>(table: T) {
  return isNull(table.deletedAt);
}

/**
 * 条件等值过滤（可选参数版）
 *
 * 当 value 为 undefined 或 null 时，不生成任何查询条件（返回 undefined），
 * 以便配合 whereAnd / and(...) 动态拼接查询。
 *
 * 当 value 有效时，等价于 eq(column, value)。
 *
 * 适用场景：
 * - 查询参数为可选字段（如 status / type / userId 等）
 * - 避免手动 if 判断再 push 条件
 *
 * 注意：
 * - 不会过滤空字符串 ''，如有需要请在业务层自行处理（如 trim 后再判断）
 */
export function eqIfDefined<TColumn extends AnyColumn>(
  column: TColumn,
  value: TColumn['_']['data'] | undefined | null,
): SQL | undefined {
  return value === undefined || value === null ? undefined : eq(column, value);
}

/**
 * 条件大于等于过滤（可选参数版）
 *
 * 当 value 为 undefined 或 null 时，不生成任何查询条件。
 * 当 value 有效时，等价于 gte(column, value)。
 */
export function gteIfDefined<TColumn extends AnyColumn>(
  column: TColumn,
  value: TColumn['_']['data'] | undefined | null,
): SQL | undefined {
  return value === undefined || value === null ? undefined : gte(column, value);
}

/**
 * 条件小于等于过滤（可选参数版）
 */
export function lteIfDefined<TColumn extends AnyColumn>(
  column: TColumn,
  value: TColumn['_']['data'] | undefined | null,
): SQL | undefined {
  return value === undefined || value === null ? undefined : lte(column, value);
}

/**
 * 多字段关键词模糊搜索
 *
 * keyword 为空、空白字符串、undefined 或 null 时，不生成查询条件。
 * 否则对多个字段生成 ILIKE '%keyword%' 条件，并用 OR 连接。
 */
export function keywordLike(
  columns: AnyColumn[],
  keyword: string | undefined | null,
): SQL | undefined {
  const value = keyword?.trim();

  if (!value || columns.length === 0) {
    return undefined;
  }

  const pattern = `%${value}%`;

  return or(...columns.map(column => ilike(column, pattern)));
}
