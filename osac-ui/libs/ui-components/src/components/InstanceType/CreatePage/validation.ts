import { TFunction } from 'i18next';
import * as Yup from 'yup';

import { resourceNameSchema } from '@osac/ui-components/validation/resource-name';

const isPositiveIntegerString = (value: string | undefined): boolean => {
  if (!value) {
    return false;
  }
  const parsed = Number(value.trim());
  return Number.isInteger(parsed) && parsed > 0;
};

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
        ),
      memoryGib: Yup.string()
        .required(t('Memory (GiB) is required'))
        .test(
          'positive-integer',
          t('Memory (GiB) must be a positive integer'),
          isPositiveIntegerString,
        ),
    }),
  });
