interface FormFieldLike {
  state: {
    meta: {
      isTouched: boolean;
      isValid: boolean;
    };
  };
}

export function isFormFieldInvalid(field: FormFieldLike) {
  return field.state.meta.isTouched && !field.state.meta.isValid;
}
