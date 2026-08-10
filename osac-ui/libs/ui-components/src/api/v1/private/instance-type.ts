import { InstanceTypes } from '@osac/types/private';

import { useApiFetch } from '../../api-context';
import { type ListParams, apiQueryKey } from '../../types';
import { useApiQuery } from '../../use-api-query';

export const useAdminInstanceTypes = (params: ListParams = {}) => {
  const client = useApiFetch(InstanceTypes);
  return useApiQuery({
    queryKey: apiQueryKey('v1/private/instance_types', undefined, params),
    queryFn: () => client.list(params),
    select: (data) => data.items,
  });
};
