import { type MessageInitShape, create } from '@bufbuild/protobuf';
import { useMutation } from '@tanstack/react-query';

import {
  StorageBackendCredentialsSchema,
  StorageBackendSchema,
  StorageBackendSpecSchema,
  StorageBackendState,
  StorageBackends,
} from '@osac/types/private';

import { useApiFetch } from '../../api-context';
import { type ListParams, apiQueryKey } from '../../types';
import { type ApiQueryClient, useApiQuery, useApiQueryClient } from '../../use-api-query';
import { buildUpdateMaskPaths } from '../update-mask';

export const STORAGE_BACKEND_READY_LIST_FILTER = `this.status.state == ${StorageBackendState.READY}`;

export const usePrivateStorageBackends = (params: ListParams = {}) => {
  const client = useApiFetch(StorageBackends);
  return useApiQuery({
    queryKey: apiQueryKey('v1/private/storage_backends', undefined, params),
    queryFn: () => client.list(params),
    select: (data) => data.items,
  });
};

export const usePrivateStorageBackend = (id: string) => {
  const client = useApiFetch(StorageBackends);
  return useApiQuery({
    queryKey: apiQueryKey('v1/private/storage_backends', [id]),
    queryFn: () => client.get({ id }),
    select: (data) => data.object,
    enabled: Boolean(id),
  });
};

export const invalidateStorageBackendsQueries = (qc: ApiQueryClient) =>
  qc.invalidateQueries({ queryKey: apiQueryKey('v1/private/storage_backends') });

export const useCreateStorageBackend = () => {
  const client = useApiFetch(StorageBackends);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: async (input: MessageInitShape<typeof StorageBackendSchema>) => {
      const resp = await client.create({ object: input });
      if (!resp.object) {
        throw new Error('Create response missing object');
      }
      return resp.object;
    },
    onSuccess: () => invalidateStorageBackendsQueries(qc),
  });
};

export type UpdateStorageBackendInput = {
  id: string;
  spec: MessageInitShape<typeof StorageBackendSpecSchema>;
};

export const useUpdateStorageBackend = () => {
  const client = useApiFetch(StorageBackends);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateStorageBackendInput) => {
      const spec: MessageInitShape<typeof StorageBackendSpecSchema> = { ...input.spec };
      if (spec.credentials) {
        spec.credentials = create(StorageBackendCredentialsSchema, spec.credentials);
      }

      const resp = await client.update({
        object: { id: input.id, spec },
        updateMask: { paths: buildUpdateMaskPaths({ spec } as Record<string, unknown>) },
      });
      if (!resp.object) {
        throw new Error('Update response missing object');
      }
      return resp.object;
    },
    onSuccess: () => invalidateStorageBackendsQueries(qc),
  });
};

export const useDeleteStorageBackend = () => {
  const client = useApiFetch(StorageBackends);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.delete({ id }),
    onSuccess: () => invalidateStorageBackendsQueries(qc),
  });
};
