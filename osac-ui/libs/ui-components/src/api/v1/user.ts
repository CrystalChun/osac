import { Users } from '@osac/types';

import { useApiFetch } from '../api-context';
import { type ListParams, apiQueryKey } from '../types';
import { useApiQuery } from '../use-api-query';

export const getTenantUsersFilter = (tenantId: string) => `this.metadata.tenant == "${tenantId}"`;

export const useUsers = (params: ListParams = {}, disabled?: boolean) => {
  const client = useApiFetch(Users);
  return useApiQuery({
    queryKey: apiQueryKey('v1/users', undefined, params),
    queryFn: () => client.list(params),
    select: (data) => data.items,
    enabled: !disabled,
  });
};
