import { StorageTierState, StorageTiers } from '@osac/types';

import { useApiFetch } from '../api-context';
import { type ListParams, apiQueryKey } from '../types';
import { useApiQuery } from '../use-api-query';

export const STORAGE_TIER_ACTIVE_LIST_FILTER = `this.status.state == ${StorageTierState.ACTIVE}`;

export const useStorageTiers = (params: ListParams = {}) => {
  const client = useApiFetch(StorageTiers);
  return useApiQuery({
    queryKey: apiQueryKey('v1/storage_tiers', undefined, params),
    queryFn: () => client.list(params),
    select: (data) => data.items,
  });
};

export const useStorageTier = (id: string) => {
  const client = useApiFetch(StorageTiers);
  return useApiQuery({
    queryKey: apiQueryKey('v1/storage_tiers', [id]),
    queryFn: () => client.get({ id }),
    select: (data) => data.object,
    enabled: Boolean(id),
  });
};
