import {
  type Cluster,
  ClusterSchema,
  type ClustersListResponse,
  ClustersListResponseSchema,
} from '@osac/types';

import { useApiQuery } from '../use-api-query';

export type ListClustersParams = {
  filter?: string;
  limit?: number;
  offset?: number;
};

export const useClusters = (params: ListClustersParams = {}) =>
  useApiQuery<ClustersListResponse, Cluster[]>({
    queryKey: ['v1/clusters', null, params],
    select: (data: ClustersListResponse) => data.items,
    meta: { decode: ClustersListResponseSchema },
  });

export const useCluster = (id: string) => {
  const trimmedId = id?.trim() ?? '';
  return useApiQuery<Cluster>({
    queryKey: ['v1/clusters', [trimmedId]],
    meta: { decode: ClusterSchema },
    enabled: Boolean(trimmedId),
  });
};
