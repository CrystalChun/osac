import { Tenants } from '@osac/types/private';

import { useApiFetch } from '../../api-context';
import { type ListParams, apiQueryKey } from '../../types';
import { useApiQuery } from '../../use-api-query';

export const useTenants = (params: ListParams = {}) => {
  const client = useApiFetch(Tenants);
  return useApiQuery({
    queryKey: apiQueryKey('v1/private/tenants', undefined, params),
    queryFn: () => client.list(params),
    select: (data) => data.items,
  });
};
