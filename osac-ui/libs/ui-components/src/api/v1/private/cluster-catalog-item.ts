import { ClusterCatalogItems } from '@osac/types/private';

import { useApiFetch } from '../../api-context';
import { type ListParams, apiQueryKey } from '../../types';
import { useApiQuery } from '../../use-api-query';

export const usePrivateClusterCatalogItems = (params: ListParams = {}, enabled = true) => {
  const client = useApiFetch(ClusterCatalogItems);
  return useApiQuery({
    queryKey: apiQueryKey('v1/private/cluster_catalog_items', undefined, params),
    queryFn: () => client.list(params),
    select: (data) => data.items,
    enabled,
  });
};
