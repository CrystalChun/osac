import { useCallback, useEffect, useState } from 'react';
import { type MessageInitShape } from '@bufbuild/protobuf';
import { useMutation } from '@tanstack/react-query';

import { ClusterSchema, Clusters } from '@osac/types';

import { useApiFetch } from '../api-context';
import { type ListParams, apiQueryKey } from '../types';
import { type ApiQueryClient, useApiQuery, useApiQueryClient } from '../use-api-query';

export const useClusters = (params: ListParams = {}) => {
  const client = useApiFetch(Clusters);
  return useApiQuery({
    queryKey: apiQueryKey('v1/clusters', undefined, params),
    queryFn: () => client.list(params),
    select: (data) => data.items,
  });
};

export const useCluster = (id: string) => {
  const client = useApiFetch(Clusters);
  const trimmedId = id?.trim() ?? '';
  return useApiQuery({
    queryKey: apiQueryKey('v1/clusters', [trimmedId]),
    queryFn: () => client.get({ id: trimmedId }),
    select: (data) => data.object,
    enabled: Boolean(trimmedId),
  });
};

export const invalidateClustersQueries = async (qc: ApiQueryClient) => {
  await qc.invalidateQueries({ queryKey: apiQueryKey('v1/clusters') });
};

export const useDeleteCluster = () => {
  const client = useApiFetch(Clusters);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.delete({ id }),
    onSuccess: () => invalidateClustersQueries(qc),
    retry: false,
  });
};

export const useProvisionCluster = () => {
  const client = useApiFetch(Clusters);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (cluster: MessageInitShape<typeof ClusterSchema>) =>
      client.create({ object: cluster }).then((r) => r.object),
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
  const client = useApiFetch(Clusters);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<unknown>();

  const download = useCallback(
    async (id: string, clusterName: string) => {
      setIsPending(true);
      setError(undefined);
      try {
        const resp = await client.getKubeconfig({ id });
        triggerDownload(resp.kubeconfig, `${clusterName}-kubeconfig.yaml`);
      } catch (e) {
        setError(e);
      } finally {
        setIsPending(false);
      }
    },
    [client],
  );

  return { download, isPending, error, setError };
};

export const useFetchClusterPassword = (id: string) => {
  const client = useApiFetch(Clusters);
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
        const resp = await client.getPassword({ id }, { signal: controller.signal });
        setPassword(resp.password);
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
  }, [client, resetId, id]);

  const retry = useCallback(() => {
    setPassword(undefined);
    setResetId((id) => id + 1);
  }, []);

  return { password, isPending, error, retry };
};
