import type { Organization, OrganizationsListResponse } from '@osac/types';

import { useApiQuery } from '../use-api-query';

export type ListOrganizationsParams = {
  filter?: string;
  limit?: number;
  offset?: number;
};

export const useOrganizations = (params: ListOrganizationsParams = {}) => {
  return useApiQuery<OrganizationsListResponse, Organization[]>({
    queryKey: ['v1/organizations', null, params],
    select: (data) => data.items,
  });
};
