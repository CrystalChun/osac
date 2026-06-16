import type { Cluster, ClustersListResponse } from '@osac/types';

import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';

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
        decode: true,
      }),
    select: (data: ClustersListResponse) => data.items,
  });
};

export const useCluster = (id: string) => {
  const apiFetch = useApiFetch();
  return useApiQuery<Cluster>({
    queryKey: ['v1/clusters', [id]],
    queryFn: () =>
      apiFetch<Cluster>('v1/clusters', {
        pathParams: [id],
        decode: true,
      }),
  });
};

export const invalidateClustersQueries = async (qc: ReturnType<typeof useApiQueryClient>) => {
  await qc.invalidateQueries({ queryKey: apiQueryKey('v1/clusters', null) });
};
