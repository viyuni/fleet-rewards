import type {
  FormApi,
  FormAsyncValidateOrFn,
  FormOptions,
  FormValidateOrFn,
  VueFormApi,
} from '@tanstack/vue-form';
import { useForm } from '@tanstack/vue-form';
import * as v from 'valibot';

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

export function stripUndefined<T extends Record<string, unknown>>(obj: T) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

export function emptyStringAsNull<T extends Record<string, unknown>>(obj: T) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, value === '' ? null : value]),
  ) as T;
}

export function useSchemaForm<
  TSchema extends v.BaseSchema<any, any, any>,
  TParentData extends v.InferInput<TSchema>,
  TFormOnMount extends undefined | FormValidateOrFn<TParentData>,
  TFormOnChange extends undefined | FormValidateOrFn<TParentData>,
  TFormOnChangeAsync extends undefined | FormAsyncValidateOrFn<TParentData>,
  TFormOnBlur extends undefined | FormValidateOrFn<TParentData>,
  TFormOnBlurAsync extends undefined | FormAsyncValidateOrFn<TParentData>,
  TFormOnSubmit extends undefined | FormValidateOrFn<TParentData>,
  TFormOnSubmitAsync extends undefined | FormAsyncValidateOrFn<TParentData>,
  TFormOnDynamic extends undefined | FormValidateOrFn<TParentData>,
  TFormOnDynamicAsync extends undefined | FormAsyncValidateOrFn<TParentData>,
  TFormOnServer extends undefined | FormAsyncValidateOrFn<TParentData>,
  TSubmitMeta,
>(
  schema: TSchema,
  opts?: FormOptions<
    TParentData,
    TFormOnMount,
    TFormOnChange,
    TFormOnChangeAsync,
    TFormOnBlur,
    TFormOnBlurAsync,
    TFormOnSubmit,
    TFormOnSubmitAsync,
    TFormOnDynamic,
    TFormOnDynamicAsync,
    TFormOnServer,
    TSubmitMeta
  > & {
    /**
     * 移除值为 undefined 的字段。
     * 常用于 PATCH / update payload。
     */
    stripUndefined?: boolean;

    /**
     * 将表单控件产生的空字符串 '' 转成 null。
     * 常用于 nullable 字段清空。
     */
    emptyStringAsNull?: boolean;

    defaultValuesFn: () => TParentData;
  },
): FormApi<
  TParentData,
  TFormOnMount,
  TFormOnChange,
  TFormOnChangeAsync,
  TFormOnBlur,
  TFormOnBlurAsync,
  TFormOnSubmit,
  TFormOnSubmitAsync,
  TFormOnDynamic,
  TFormOnDynamicAsync,
  TFormOnServer,
  TSubmitMeta
> &
  VueFormApi<
    TParentData,
    TFormOnMount,
    TFormOnChange,
    TFormOnChangeAsync,
    TFormOnBlur,
    TFormOnBlurAsync,
    TFormOnSubmit,
    TFormOnSubmitAsync,
    TFormOnDynamic,
    TFormOnDynamicAsync,
    TFormOnServer,
    TSubmitMeta
  > {
  return useForm({
    ...opts,
    defaultValues: opts?.defaultValues ?? opts?.defaultValuesFn?.(),
    validators: {
      onSubmit: schema as any,
      onBlur: schema as any,
      ...opts?.validators,
    },
    onSubmit(props) {
      let input = props.value;

      if (opts?.emptyStringAsNull) {
        input = emptyStringAsNull(input) as typeof input;
      }

      if (opts?.stripUndefined) {
        input = stripUndefined(input) as typeof input;
      }

      const output = v.parse(schema, input);

      return opts?.onSubmit?.({
        ...props,
        value: output,
      });
    },
  });
}
