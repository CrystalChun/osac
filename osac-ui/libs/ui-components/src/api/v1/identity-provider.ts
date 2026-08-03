import { IdentityProviders } from '@osac/types';

import { useApiFetch } from '../api-context';
import { type ListParams, apiQueryKey } from '../types';
import { useApiQuery } from '../use-api-query';

export const useIdentityProviders = (params: ListParams = {}) => {
  const client = useApiFetch(IdentityProviders);
  return useApiQuery({
    queryKey: apiQueryKey('v1/identity_providers', undefined, params),
    queryFn: () => client.list(params),
    select: (data) => data.items,
  });
};
