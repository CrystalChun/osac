import type { TFunction } from 'i18next';
import * as Yup from 'yup';

export const positiveIntegerSchema = (t: TFunction): Yup.NumberSchema =>
  Yup.number()
    .transform((value: number, originalValue: unknown) =>
      originalValue === '' ? undefined : value,
    )
    .required(t('This field is required'))
    .typeError(t('Must be a whole number'))
    .integer(t('Must be a whole number'))
    .positive(t('Must be greater than zero'));
