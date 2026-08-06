import { StorageTiers } from '@osac/types/private';

import { useApiFetch } from '../../api-context';
import { type ListParams, apiQueryKey } from '../../types';
import { useApiQuery } from '../../use-api-query';

export const usePrivateStorageTiers = (params: ListParams = {}) => {
  const client = useApiFetch(StorageTiers);
  return useApiQuery({
    queryKey: apiQueryKey('v1/private/storage_tiers', undefined, params),
    queryFn: () => client.list(params),
    select: (data) => data.items,
  });
};

export const usePrivateStorageTier = (id: string) => {
  const client = useApiFetch(StorageTiers);
  return useApiQuery({
    queryKey: apiQueryKey('v1/private/storage_tiers', [id]),
    queryFn: () => client.get({ id }),
    select: (data) => data.object,
    enabled: Boolean(id),
  });
};
