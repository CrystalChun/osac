import { TFunction } from 'i18next';
import * as Yup from 'yup';

import { resourceNameSchema } from '@osac/ui-components/validation/resource-name';

const MAX_INT32 = 2147483647;

const isPositiveIntegerString = (value: string | undefined): boolean => {
  if (!value) {
    return false;
  }
  const parsed = Number(value.trim());
  return Number.isInteger(parsed) && parsed > 0;
};

const isAtMostInt32 = (value: string | undefined): boolean =>
  !value || Number(value.trim()) <= MAX_INT32;

export const getInstanceTypeCreateSchema = (t: TFunction) =>
  Yup.object({
    metadata: Yup.object({
      name: resourceNameSchema(t),
    }),
    spec: Yup.object({
      description: Yup.string(),
      cores: Yup.string()
        .required(t('CPU cores is required'))
        .test(
          'positive-integer',
          t('CPU cores must be a positive integer'),
          isPositiveIntegerString,
        )
        .test(
          'max-int32',
          t('CPU cores must be at most {{max}}', { max: MAX_INT32 }),
          isAtMostInt32,
        ),
      memoryGib: Yup.string()
        .required(t('Memory (GiB) is required'))
        .test(
          'positive-integer',
          t('Memory (GiB) must be a positive integer'),
          isPositiveIntegerString,
        )
        .test(
          'max-int32',
          t('Memory (GiB) must be at most {{max}}', { max: MAX_INT32 }),
          isAtMostInt32,
        ),
    }),
  });
