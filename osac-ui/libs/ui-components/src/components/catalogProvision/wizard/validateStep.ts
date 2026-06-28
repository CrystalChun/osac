import type { FormikErrors, FormikProps, FormikTouched } from 'formik';
import { ValidationError } from 'yup';
import type { AnyObjectSchema } from 'yup';

const setNestedValue = (
  target: Record<string, unknown>,
  path: string,
  value: unknown,
): void => {
  const parts = path.split('.');
  let current: Record<string, unknown> = target;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const key = parts[index];
    if (!current[key] || typeof current[key] !== 'object' || Array.isArray(current[key])) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
};

export const buildStepTouched = (fieldPaths: string[]): Record<string, unknown> => {
  const touched: Record<string, unknown> = {};
  for (const path of fieldPaths) {
    setNestedValue(touched, path, true);
  }
  return touched;
};

const deepMergeRecords = (
  base: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> => {
  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const existing = result[key];
      result[key] =
        existing && typeof existing === 'object' && !Array.isArray(existing)
          ? deepMergeRecords(existing as Record<string, unknown>, value as Record<string, unknown>)
          : value;
    } else {
      result[key] = value;
    }
  }
  return result;
};

export const mergeStepTouched = (
  currentTouched: Record<string, unknown>,
  fieldPaths: string[],
): Record<string, unknown> => deepMergeRecords(currentTouched, buildStepTouched(fieldPaths));

export const validationErrorToFormikErrors = (
  error: ValidationError,
): FormikErrors<Record<string, unknown>> => {
  const errors: FormikErrors<Record<string, unknown>> = {};
  for (const inner of error.inner) {
    if (!inner.path) {
      continue;
    }
    setNestedValue(errors, inner.path, inner.message);
  }
  if (error.path && error.message) {
    setNestedValue(errors, error.path, error.message);
  }
  return errors;
};

const collectStepFieldErrors = (
  schema: AnyObjectSchema,
  values: Record<string, unknown>,
  fieldPaths: string[],
): FormikErrors<Record<string, unknown>> => {
  const innerErrors: ValidationError[] = [];
  for (const path of fieldPaths) {
    try {
      schema.validateSyncAt(path, values);
    } catch (error) {
      if (error instanceof ValidationError) {
        innerErrors.push(error);
      }
    }
  }

  if (innerErrors.length === 0) {
    return {};
  }

  return validationErrorToFormikErrors(new ValidationError(innerErrors));
};

export const validateWizardStepFields = (
  schema: AnyObjectSchema | undefined,
  values: Record<string, unknown>,
  fieldPaths: string[],
): FormikErrors<Record<string, unknown>> => {
  if (!schema || fieldPaths.length === 0) {
    return {};
  }

  return collectStepFieldErrors(schema, values, fieldPaths);
};

export const applyStepValidationState = <TValues>(
  formik: FormikProps<TValues>,
  fieldPaths: string[],
  errors: FormikErrors<TValues>,
): boolean => {
  if (Object.keys(errors).length === 0) {
    return true;
  }

  formik.setFormikState((prev) => ({
    ...prev,
    touched: mergeStepTouched(
      prev.touched as Record<string, unknown>,
      fieldPaths,
    ) as FormikTouched<TValues>,
    errors: errors as FormikErrors<TValues>,
  }));
  return false;
};
