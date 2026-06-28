import type { FieldMetaProps } from 'formik';

export const getVisibleFieldError = (
  meta: FieldMetaProps<unknown>,
  showValidationErrors: boolean,
): string | undefined => {
  if (!meta.error) {
    return undefined;
  }
  if (meta.touched || showValidationErrors) {
    return String(meta.error);
  }
  return undefined;
};
