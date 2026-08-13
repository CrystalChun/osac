import { TFunction } from 'i18next';
import * as Yup from 'yup';

import { positiveIntegerSchema } from '@osac/ui-components/validation/positive-integer';
import { resourceNameSchema } from '@osac/ui-components/validation/resource-name';

const MAX_INT32 = 2147483647;
const GPU_COUNT_MIN = 1;
const GPU_COUNT_MAX = 16;

const isGpuFieldProvided = (value?: string | number) => Boolean(value);
const requiredForGpu = (t: TFunction) => t('Required when configuring a GPU');

const getGpuCountSchema = (t: TFunction) =>
  Yup.number()
    .transform((value: number, originalValue: unknown) =>
      originalValue === '' ? undefined : value,
    )
    .typeError(t('Must be a whole number'))
    .integer(t('Must be a whole number'))
    .min(GPU_COUNT_MIN, t('Must be at least {{min}}', { min: GPU_COUNT_MIN }))
    .max(GPU_COUNT_MAX, t('Must be at most {{max}}', { max: GPU_COUNT_MAX }));

export const getInstanceTypeCreateSchema = (t: TFunction) =>
  Yup.object({
    metadata: Yup.object({
      name: resourceNameSchema(t),
    }),
    spec: Yup.object({
      description: Yup.string(),
      cores: positiveIntegerSchema(t, MAX_INT32),
      memoryGib: positiveIntegerSchema(t, MAX_INT32),
      gpu: Yup.lazy(
        (gpu: { pciDeviceSelector?: string; resourceName?: string; count?: number } = {}) => {
          const anyProvided =
            isGpuFieldProvided(gpu.pciDeviceSelector) ||
            isGpuFieldProvided(gpu.resourceName) ||
            isGpuFieldProvided(gpu.count);

          return Yup.object({
            pciDeviceSelector: anyProvided
              ? Yup.string().required(requiredForGpu(t))
              : Yup.string(),
            resourceName: anyProvided ? Yup.string().required(requiredForGpu(t)) : Yup.string(),
            count: anyProvided
              ? getGpuCountSchema(t).required(requiredForGpu(t))
              : getGpuCountSchema(t),
          });
        },
      ),
    }),
  });
