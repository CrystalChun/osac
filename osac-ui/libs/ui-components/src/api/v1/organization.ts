import { Organizations } from '@osac/types';

import { useApiFetch } from '../api-context';
import { type ListParams, apiQueryKey } from '../types';
import { useApiQuery } from '../use-api-query';

export const useOrganizations = (params: ListParams = {}) => {
  const client = useApiFetch(Organizations);
  return useApiQuery({
    queryKey: apiQueryKey('v1/organizations', undefined, params),
    queryFn: () => client.list(params),
    select: (data) => data.items,
  });
};
