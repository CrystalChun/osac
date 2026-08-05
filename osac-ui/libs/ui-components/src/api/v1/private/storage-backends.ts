import { StorageBackendState, StorageBackends } from '@osac/types/private';

import { useApiFetch } from '../../api-context';
import { type ListParams, apiQueryKey } from '../../types';
import { useApiQuery } from '../../use-api-query';

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
