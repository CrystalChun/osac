import { TFunction } from 'i18next';
import * as Yup from 'yup';

import { positiveIntegerSchema } from '@osac/ui-components/validation/positive-integer';
import { resourceNameSchema } from '@osac/ui-components/validation/resource-name';

const MAX_INT32 = 2147483647;
const GPU_COUNT_MIN = 1;
const GPU_COUNT_MAX = 16;

const isGpuFieldProvided = (value?: string | number) => Boolean(value);
const requiredForGpu = (t: TFunction) => t('Required when configuring a GPU');

// A plain object-level test (rather than per-field `.when()`) avoids a cyclic dependency:
// each of the three GPU fields would otherwise need to watch the other two.
const requireGpuFieldWhenAnyProvided = (
  t: TFunction,
  field: 'pciDeviceSelector' | 'resourceName' | 'count',
) =>
  function (
    this: Yup.TestContext,
    gpu: { pciDeviceSelector?: string; resourceName?: string; count?: number } | undefined,
  ) {
    if (!gpu || isGpuFieldProvided(gpu[field])) {
      return true;
    }
    const otherFields = (['pciDeviceSelector', 'resourceName', 'count'] as const).filter(
      (key) => key !== field,
    );
    const anyOtherProvided = otherFields.some((key) => isGpuFieldProvided(gpu[key]));
    if (!anyOtherProvided) {
      return true;
    }
    return this.createError({
      path: `${this.path}.${field}`,
      message: requiredForGpu(t),
    });
  };

export const getInstanceTypeCreateSchema = (t: TFunction) =>
  Yup.object({
    metadata: Yup.object({
      name: resourceNameSchema(t),
    }),
    spec: Yup.object({
      description: Yup.string(),
      cores: positiveIntegerSchema(t, MAX_INT32),
      memoryGib: positiveIntegerSchema(t, MAX_INT32),
      gpu: Yup.object({
        pciDeviceSelector: Yup.string(),
        resourceName: Yup.string(),
        count: Yup.number()
          .transform((value: number, originalValue: unknown) =>
            originalValue === '' ? undefined : value,
          )
          .typeError(t('Must be a whole number'))
          .integer(t('Must be a whole number'))
          .min(GPU_COUNT_MIN, t('Must be at least {{min}}', { min: GPU_COUNT_MIN }))
          .max(GPU_COUNT_MAX, t('Must be at most {{max}}', { max: GPU_COUNT_MAX })),
      })
        .test(
          'pci-device-selector-required-for-gpu',
          requiredForGpu(t),
          requireGpuFieldWhenAnyProvided(t, 'pciDeviceSelector'),
        )
        .test(
          'resource-name-required-for-gpu',
          requiredForGpu(t),
          requireGpuFieldWhenAnyProvided(t, 'resourceName'),
        )
        .test(
          'count-required-for-gpu',
          requiredForGpu(t),
          requireGpuFieldWhenAnyProvided(t, 'count'),
        ),
    }),
  });
