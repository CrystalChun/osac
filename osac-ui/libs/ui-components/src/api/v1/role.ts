import { Roles } from '@osac/types';

import { useApiFetch } from '../api-context';
import { type ListParams, apiQueryKey } from '../types';
import { useApiQuery } from '../use-api-query';

export const useRoles = (params: ListParams = {}) => {
  const client = useApiFetch(Roles);
  return useApiQuery({
    queryKey: apiQueryKey('v1/roles', undefined, params),
    queryFn: () => client.list(params),
    select: (data) => data.items,
  });
};
