import {
  type InstanceType,
  InstanceTypeSchema,
  InstanceTypeState,
  type InstanceTypesListResponse,
  InstanceTypesListResponseSchema,
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

export const useInstanceType = (id: string | undefined) => {
  const trimmedId = id?.trim() ?? '';
  return useApiQuery<InstanceType>({
    queryKey: ['v1/instance_types', trimmedId ? [trimmedId] : null],
    meta: { decode: InstanceTypeSchema },
    enabled: Boolean(trimmedId),
  });
};

export const isObsoleteInstanceType = (instanceType: InstanceType): boolean =>
  instanceType.spec?.state === InstanceTypeState.OBSOLETE;

export const isDeprecatedInstanceType = (instanceType: InstanceType): boolean =>
  instanceType.spec?.state === InstanceTypeState.DEPRECATED;

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

/** Resolved display name for summary (name + deprecated suffix; no sizing). */
export const formatInstanceTypeDisplayName = (
  instanceType: InstanceType | undefined,
  deprecatedSuffix = ' (deprecated)',
  fallbackId?: string,
): string => {
  if (!instanceType) {
    return fallbackId?.trim() || '—';
  }
  const name = instanceTypeName(instanceType);
  const deprecated = isDeprecatedInstanceType(instanceType) ? deprecatedSuffix : '';
  return `${name}${deprecated}`;
};

export const formatInstanceTypeReviewLabelFromType = (
  instanceType: InstanceType | undefined,
  deprecatedSuffix = ' (deprecated)',
  fallbackId?: string,
): string => {
  if (!instanceType) {
    return fallbackId?.trim() || '—';
  }
  return formatInstanceTypeOptionLabel(instanceType, deprecatedSuffix);
};

export const formatInstanceTypeReviewLabel = (
  instanceTypeId: string,
  instanceTypes: InstanceType[],
  deprecatedSuffix = ' (deprecated)',
): string =>
  formatInstanceTypeReviewLabelFromType(
    instanceTypes.find((item) => item.id === instanceTypeId),
    deprecatedSuffix,
    instanceTypeId,
  );
