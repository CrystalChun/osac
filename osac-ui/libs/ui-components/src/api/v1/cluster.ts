import { useCallback, useState } from 'react';
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

export const useProvisionCluster = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (cluster: Cluster) =>
      apiFetch<Cluster>('v1/clusters', {
        method: 'POST',
        body: cluster,
        decode: ClusterSchema,
      }),
    onSuccess: async () => {
      await invalidateClustersQueries(qc);
    },
    retry: false,
  });
};

const triggerDownload = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const useDownloadKubeconfig = () => {
  const apiFetch = useApiFetch();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const download = useCallback(
    async (id: string, clusterName: string) => {
      setIsPending(true);
      setError(null);
      try {
        const kubeconfig = await apiFetch<string>('v1/clusters', {
          pathParams: [id, 'kubeconfig'],
          rawText: true,
        });
        triggerDownload(kubeconfig, `${clusterName}-kubeconfig.yaml`);
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
        throw e;
      } finally {
        setIsPending(false);
      }
    },
    [apiFetch],
  );

  return { download, isPending, error };
};

export const useFetchClusterPassword = () => {
  const apiFetch = useApiFetch();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [password, setPassword] = useState<string | null>(null);

  const fetchPassword = useCallback(
    async (id: string) => {
      setIsPending(true);
      setError(null);
      try {
        const result = await apiFetch<string>('v1/clusters', {
          pathParams: [id, 'password'],
          rawText: true,
        });
        setPassword(result);
        return result;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        throw err;
      } finally {
        setIsPending(false);
      }
    },
    [apiFetch],
  );

  const reset = useCallback(() => {
    setPassword(null);
    setError(null);
  }, []);

  return { fetchPassword, isPending, error, password, reset };
};
