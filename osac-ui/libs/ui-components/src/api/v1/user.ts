import { Users } from '@osac/types';

import { useApiFetch } from '../api-context';
import { type ListParams, apiQueryKey } from '../types';
import { useApiQuery } from '../use-api-query';

export const useUsers = (params: ListParams = {}) => {
  const client = useApiFetch(Users);
  return useApiQuery({
    queryKey: apiQueryKey('v1/users', undefined, params),
    queryFn: () => client.list(params),
    select: (data) => data.items,
  });
};
