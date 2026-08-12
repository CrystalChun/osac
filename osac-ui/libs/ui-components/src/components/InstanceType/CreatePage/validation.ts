import { TFunction } from 'i18next';
import * as Yup from 'yup';

import { positiveIntegerSchema } from '@osac/ui-components/validation/positive-integer';
import { resourceNameSchema } from '@osac/ui-components/validation/resource-name';

const MAX_INT32 = 2147483647;

export const getInstanceTypeCreateSchema = (t: TFunction) =>
  Yup.object({
    metadata: Yup.object({
      name: resourceNameSchema(t),
    }),
    spec: Yup.object({
      description: Yup.string(),
      cores: positiveIntegerSchema(t, MAX_INT32),
      memoryGib: positiveIntegerSchema(t, MAX_INT32),
    }),
  });
