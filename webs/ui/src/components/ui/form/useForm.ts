import { toTypedSchema } from '@vee-validate/valibot';
import { createEventHook, whenever } from '@vueuse/core';
import type { PartialDeep } from 'type-fest';
import type { InferOutput, InferInput, BaseSchema, BaseIssue, BaseSchemaAsync } from 'valibot';
import {
  useForm as useVeeForm,
  type FormContext as VeeFormContext,
  type FormState as VeeFormState,
  type InvalidSubmissionContext as VeeInvalidSubmissionContext,
  type SubmissionContext as VeeSubmissionContext,
  type SubmissionHandler,
  type ResetFormOpts as VeeResetFormOpts,
} from 'vee-validate';
import { computed, onMounted, ref, unref, watch, type MaybeRef, type Ref } from 'vue';

type AnyFormSchema =
  | BaseSchema<any, any, BaseIssue<unknown>>
  | BaseSchemaAsync<any, any, BaseIssue<unknown>>;

export type FormInput<TSchema extends AnyFormSchema> = InferInput<TSchema>;

export type FormOutput<TSchema extends AnyFormSchema> = InferOutput<TSchema>;

export type FormInitialValues<TSchema extends AnyFormSchema> = PartialDeep<
  FormInput<TSchema>,
  {
    recurseIntoArrays: false;
    allowUndefinedInNonTupleArrays: true;
  }
>;

export type FormContext<TSchema extends AnyFormSchema> = VeeFormContext<
  FormInput<TSchema>,
  FormOutput<TSchema>
>;

export type StateContext<TSchema extends AnyFormSchema> = VeeFormState<FormInput<TSchema>>;

export type InvalidSubmissionContext<TSchema extends AnyFormSchema> = VeeInvalidSubmissionContext<
  FormInput<TSchema>,
  FormOutput<TSchema>
>;

export type FormSubmissionContext<TSchema extends AnyFormSchema> = VeeSubmissionContext<
  FormInput<TSchema>
>;

export type FormSubmissionHandler<TSchema extends AnyFormSchema> = SubmissionHandler<
  FormInput<TSchema>,
  FormOutput<TSchema>
>;

export type FormSubmitSuccessHandler<TSchema extends AnyFormSchema> = (
  values: FormOutput<TSchema>,
  ctx: FormSubmissionContext<TSchema>,
  result: unknown,
) => unknown;

export type FormInvalidSubmissionHandler<TSchema extends AnyFormSchema> = (
  ctx: InvalidSubmissionContext<TSchema>,
) => unknown;

export interface FormMutation<TVariables, TData = unknown> {
  isLoading?: MaybeRef<boolean>;
  mutateAsync(variables: TVariables): Promise<TData> | TData;
}

type UseFormOptions<TSchema extends AnyFormSchema> = {
  schema: TSchema;
  resetOnSuccess?: boolean;
  mutation?: FormMutation<FormOutput<TSchema>>;
  omitUndefinedField?: boolean;
  initialValues: () => FormInitialValues<TSchema>;
};

function omitUndefined<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as T;
}

export function useForm<const TSchema extends AnyFormSchema>(opts: UseFormOptions<TSchema>) {
  const validationSchema = toTypedSchema<TSchema, FormOutput<TSchema>, FormInput<TSchema>>(
    opts.schema,
  );

  const { initialValues, resetOnSuccess = true, omitUndefinedField = true } = opts;

  const form = useVeeForm<FormInput<TSchema>, FormOutput<TSchema>, typeof validationSchema>({
    validationSchema,
    initialValues: initialValues(),
  });

  const submitSuccessHook =
    createEventHook<[FormOutput<TSchema>, FormSubmissionContext<TSchema>, unknown]>();
  const invalidSubmitHook = createEventHook<InvalidSubmissionContext<TSchema>>();

  function onSubmitSuccess(handler: FormSubmitSuccessHandler<TSchema>) {
    return submitSuccessHook.on(handler);
  }

  function onInvalidSubmit(handler: FormInvalidSubmissionHandler<TSchema>) {
    return invalidSubmitHook.on(handler);
  }

  const resetForm: typeof form.resetForm = (
    state = { values: initialValues() },
    opts?: Partial<VeeResetFormOpts>,
  ) => {
    form.resetForm(state, opts);
  };

  const handleSubmit = form.handleSubmit(
    async (values, ctx) => {
      let result: unknown;
      let formValues = values;

      if (omitUndefinedField) {
        formValues = omitUndefined(formValues);
      }

      if (opts.mutation) {
        result = await opts.mutation.mutateAsync(formValues);
      }

      if (resetOnSuccess) {
        resetForm();
      }

      await submitSuccessHook.trigger(formValues, ctx, result);

      return result;
    },
    ctx => invalidSubmitHook.trigger(ctx),
  );

  const isLoading = opts.mutation?.isLoading;
  const canSubmit = computed(() => !unref(isLoading) && form.meta.value.valid);

  return {
    ...form,
    validationSchema,
    form,
    canSubmit,
    isLoading,
    resetForm,
    handleSubmit,
    onSubmitSuccess,
    onInvalidSubmit,
  };
}

type UsePopoverFormOptions<TSchema extends AnyFormSchema> = UseFormOptions<TSchema> & {
  open?: Ref<boolean>;
  resetOnClose?: boolean;
  resetOnMount?: boolean;
  resetOnOpen?: boolean;
  resetOnInitialValuesChange?: boolean;
  closeOnSuccess?: boolean;
};

export function usePopoverForm<const TSchema extends AnyFormSchema>(
  opts: UsePopoverFormOptions<TSchema>,
) {
  const open = opts.open ?? ref(false);
  const form = useForm(opts);
  const {
    closeOnSuccess = true,
    resetOnClose = true,
    resetOnMount = false,
    resetOnOpen = false,
    resetOnInitialValuesChange = true,
  } = opts;

  onMounted(() => {
    if (resetOnMount) {
      form.resetForm();
    }
  });

  if (resetOnClose) {
    whenever(
      () => !open.value,
      () => form.resetForm(),
    );
  }

  if (resetOnOpen) {
    whenever(
      () => open.value,
      () => form.resetForm(),
    );
  }

  if (resetOnInitialValuesChange) {
    watch(
      () => opts.initialValues(),
      () => {
        form.resetForm();
      },
    );
  }

  if (closeOnSuccess) {
    form.onSubmitSuccess(() => {
      open.value = false;
    });
  }

  return {
    ...form,
    open,
  };
}
