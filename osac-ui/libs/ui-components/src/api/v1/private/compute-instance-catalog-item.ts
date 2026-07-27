import { ComputeInstanceCatalogItems } from '@osac/types/private';

import { useApiFetch } from '../../api-context';
import { type ListParams, apiQueryKey } from '../../types';
import { useApiQuery } from '../../use-api-query';

export const usePrivateComputeInstanceCatalogItems = (params: ListParams = {}, enabled = true) => {
  const client = useApiFetch(ComputeInstanceCatalogItems);
  return useApiQuery({
    queryKey: apiQueryKey('v1/private/compute_instance_catalog_items', undefined, params),
    queryFn: () => client.list(params),
    select: (data) => data.items,
    enabled,
  });
};
