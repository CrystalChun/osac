import {
  type InstanceType,
  InstanceTypeState,
  InstanceTypesListResponseSchema,
  type InstanceTypesListResponse,
} from '@osac/types';

import { useApiQuery } from '../use-api-query';
import { resourceDisplayName } from './networking';

export type ListInstanceTypesParams = {
  filter?: string;
  limit?: number;
  offset?: number;
  order?: string;
};

type InstanceTypesQueryOptions = {
  enabled?: boolean;
};

export const useInstanceTypes = (
  params: ListInstanceTypesParams = {},
  options: InstanceTypesQueryOptions = {},
) =>
  useApiQuery<InstanceTypesListResponse, InstanceType[]>({
    queryKey: ['v1/instance_types', null, params],
    select: (data) => data.items.filter((item) => !isObsoleteInstanceType(item)),
    meta: { decode: InstanceTypesListResponseSchema },
    enabled: options.enabled ?? true,
  });

export const isObsoleteInstanceType = (instanceType: InstanceType): boolean =>
  instanceType.spec?.state === InstanceTypeState.INSTANCE_TYPE_STATE_OBSOLETE;

export const isDeprecatedInstanceType = (instanceType: InstanceType): boolean =>
  instanceType.spec?.state === InstanceTypeState.INSTANCE_TYPE_STATE_DEPRECATED;

export const instanceTypeName = (instanceType: InstanceType): string =>
  resourceDisplayName(instanceType.metadata, instanceType.id);

export const formatInstanceTypeSizing = (instanceType: InstanceType): string => {
  const cores = instanceType.spec?.cores;
  const memoryGib = instanceType.spec?.memoryGib;
  if (cores == null || memoryGib == null) {
    return '—';
  }
  return `${cores} vCPU, ${memoryGib} GiB`;
};

export const formatInstanceTypeOptionLabel = (
  instanceType: InstanceType,
  deprecatedSuffix = ' (deprecated)',
): string => {
  const name = instanceTypeName(instanceType);
  const sizing = formatInstanceTypeSizing(instanceType);
  const deprecated = isDeprecatedInstanceType(instanceType) ? deprecatedSuffix : '';
  return `${name} — ${sizing}${deprecated}`;
};

export const formatInstanceTypeReviewLabel = (
  instanceTypeId: string,
  instanceTypes: InstanceType[],
  deprecatedSuffix = ' (deprecated)',
): string => {
  const instanceType = instanceTypes.find((item) => item.id === instanceTypeId);
  if (!instanceType) {
    return instanceTypeId || '—';
  }
  return formatInstanceTypeOptionLabel(instanceType, deprecatedSuffix);
};
