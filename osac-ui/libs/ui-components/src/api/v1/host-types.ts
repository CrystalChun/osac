import {
  type HostType,
  HostTypeSchema,
  type HostTypesListResponse,
  HostTypesListResponseSchema,
} from '@osac/types';

import { useApiQuery } from '../use-api-query';
import { resourceDisplayName } from './networking';

export type ListHostTypesParams = {
  filter?: string;
  limit?: number;
  offset?: number;
  order?: string;
};

type HostTypesQueryOptions = {
  enabled?: boolean;
};

export const useHostTypes = (
  params: ListHostTypesParams = {},
  options: HostTypesQueryOptions = {},
) =>
  useApiQuery<HostTypesListResponse, HostType[]>({
    queryKey: ['v1/host_types', null, params],
    select: (data) => data.items,
    meta: { decode: HostTypesListResponseSchema },
    enabled: options.enabled ?? true,
  });

export const useHostType = (id: string | undefined) =>
  useApiQuery<HostType>({
    queryKey: ['v1/host_types', id ? [id] : null],
    meta: { decode: HostTypeSchema },
    enabled: Boolean(id),
  });

export const hostTypeDisplayName = (hostType: HostType): string =>
  hostType.title?.trim() || resourceDisplayName(hostType.metadata, hostType.id);
