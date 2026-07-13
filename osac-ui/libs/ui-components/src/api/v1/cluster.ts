import { useCallback, useEffect, useState } from 'react';
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
  const [error, setError] = useState<unknown>();

  const download = useCallback(
    async (id: string, clusterName: string) => {
      setIsPending(true);
      setError(undefined);
      try {
        const kubeconfig = await apiFetch<string>('v1/clusters', {
          pathParams: [id, 'kubeconfig'],
          rawText: true,
        });
        triggerDownload(kubeconfig, `${clusterName}-kubeconfig.yaml`);
      } catch (e) {
        setError(e);
      } finally {
        setIsPending(false);
      }
    },
    [apiFetch],
  );

  return { download, isPending, error, setError };
};

export const useFetchClusterPassword = (clusterId: string) => {
  const apiFetch = useApiFetch();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<unknown>();
  const [password, setPassword] = useState<string>();
  const [resetId, setResetId] = useState<number>(0);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      setIsPending(true);
      setError(undefined);
      try {
        const result = await apiFetch<string>('v1/clusters', {
          pathParams: [clusterId, 'password'],
          rawText: true,
          signal: controller.signal,
        });
        setPassword(result);
      } catch (e) {
        if (!controller.signal.aborted) {
          setError(e);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsPending(false);
        }
      }
    })();
    return () => controller.abort();
  }, [apiFetch, clusterId, resetId]);

  const retry = useCallback(() => {
    setPassword(undefined);
    setResetId((id) => id + 1);
  }, []);

  return { password, isPending, error, retry };
};
