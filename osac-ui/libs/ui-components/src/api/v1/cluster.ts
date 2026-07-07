import { useMutation } from '@tanstack/react-query';

import {
  type Cluster,
  ClusterSchema,
  type ClustersListResponse,
  ClustersListResponseSchema,
} from '@osac/types';

import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';
import { type BuildClusterCreateBodyInput, buildClusterCreateBody } from './cluster-wire';

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

export const invalidateClustersQueries = async (qc: ReturnType<typeof useApiQueryClient>) => {
  await qc.invalidateQueries({ queryKey: apiQueryKey('v1/clusters', null) });
};

export const useDeleteCluster = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('v1/clusters', {
        pathParams: [id],
        method: 'DELETE',
      }),
    onSuccess: () => invalidateClustersQueries(qc),
    retry: false,
  });
};

export type ProvisionClusterInput = {
  cluster: BuildClusterCreateBodyInput;
  /** When true, POST body must include `spec.catalog_item`. */
  specCatalogItemOnly?: boolean;
};

export const useProvisionCluster = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: async ({
      cluster,
      specCatalogItemOnly,
    }: ProvisionClusterInput): Promise<Cluster> => {
      const created = await apiFetch<Cluster>('v1/clusters', {
        method: 'POST',
        body: buildClusterCreateBody(cluster, { specCatalogItemOnly }),
        decode: ClusterSchema,
      });
      if (!created.id) {
        throw new Error('Create response missing id');
      }
      return created;
    },
    onSuccess: async () => {
      await invalidateClustersQueries(qc);
    },
    retry: false,
  });
};
