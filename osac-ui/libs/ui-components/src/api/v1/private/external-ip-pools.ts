import { type MessageInitShape } from '@bufbuild/protobuf';
import { useMutation } from '@tanstack/react-query';

import { ExternalIPPoolSchema, ExternalIPPools } from '@osac/types/private';

import { useApiFetch } from '../../api-context';
import { type ListParams, apiQueryKey } from '../../types';
import { type ApiQueryClient, useApiQuery, useApiQueryClient } from '../../use-api-query';
import { buildUpdateMaskPaths } from '../update-mask';

type ExternalIPPoolsListOptions = {
  enabled?: boolean;
};

export const usePrivateExternalIPPools = (
  params: ListParams = {},
  options: ExternalIPPoolsListOptions = {},
) => {
  const client = useApiFetch(ExternalIPPools);
  return useApiQuery({
    queryKey: apiQueryKey('v1/private/external_ip_pools', undefined, params),
    queryFn: () => client.list(params),
    select: (data) => data.items,
    enabled: options.enabled ?? true,
  });
};

export const usePrivateExternalIPPool = (id: string) => {
  const client = useApiFetch(ExternalIPPools);
  return useApiQuery({
    queryKey: apiQueryKey('v1/private/external_ip_pools', [id]),
    queryFn: () => client.get({ id }),
    select: (data) => data.object,
    enabled: Boolean(id),
  });
};

export const invalidatePrivateExternalIPPoolsQueries = (qc: ApiQueryClient) =>
  qc.invalidateQueries({ queryKey: apiQueryKey('v1/private/external_ip_pools') });

export const useCreateExternalIPPool = () => {
  const client = useApiFetch(ExternalIPPools);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: async (input: MessageInitShape<typeof ExternalIPPoolSchema>) => {
      const resp = await client.create({ object: input });
      if (!resp.object) {
        throw new Error('Create response missing object');
      }
      return resp.object;
    },
    onSuccess: () => invalidatePrivateExternalIPPoolsQueries(qc),
  });
};

export type UpdateExternalIPPoolInput = {
  id: string;
  /** The `metadata.version` of the record the caller last fetched — required so the server can enforce the lock below; a request with no metadata is exempt from the optimistic-lock check regardless of `lock: true`. */
  version: number;
  name: string;
};

export const useUpdateExternalIPPool = () => {
  const client = useApiFetch(ExternalIPPools);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateExternalIPPoolInput) => {
      const resp = await client.update({
        object: { id: input.id, metadata: { version: input.version, name: input.name } },
        updateMask: { paths: buildUpdateMaskPaths({ metadata: { name: input.name } }) },
        lock: true,
      });
      if (!resp.object) {
        throw new Error('Update response missing object');
      }
      return resp.object;
    },
    onSuccess: () => invalidatePrivateExternalIPPoolsQueries(qc),
  });
};

export const useDeleteExternalIPPool = () => {
  const client = useApiFetch(ExternalIPPools);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.delete({ id }),
    onSuccess: () => invalidatePrivateExternalIPPoolsQueries(qc),
  });
};
