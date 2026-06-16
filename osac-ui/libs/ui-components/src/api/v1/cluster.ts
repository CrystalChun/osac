import {
  type Cluster,
  ClusterSchema,
  type ClustersListResponse,
  ClustersListResponseSchema,
} from '@osac/types';

import { useApiFetch } from '../api-context';
import { useApiQuery } from '../use-api-query';

export type ListClustersParams = {
  filter?: string;
  limit?: number;
  offset?: number;
};

export const useClusters = (params: ListClustersParams = {}) => {
  const apiFetch = useApiFetch();
  return useApiQuery<ClustersListResponse, Cluster[]>({
    queryKey: ['v1/clusters', null, params],
    queryFn: () =>
      apiFetch<ClustersListResponse>('v1/clusters', {
        queryParams: params,
        decode: ClustersListResponseSchema,
      }),
    select: (data: ClustersListResponse) => data.items,
  });
};

export const useCluster = (id: string) => {
  const apiFetch = useApiFetch();
  const trimmedId = id?.trim() ?? '';
  return useApiQuery<Cluster>({
    queryKey: ['v1/clusters', [trimmedId]],
    queryFn: () =>
      apiFetch<Cluster>('v1/clusters', {
        pathParams: [trimmedId],
        decode: ClusterSchema,
      }),
    enabled: Boolean(trimmedId),
  });
};
