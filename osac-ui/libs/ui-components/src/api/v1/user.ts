import type { User, UsersListResponse } from '@osac/types';

import { useApiQuery } from '../use-api-query';

export type ListUsersParams = {
  filter?: string;
  limit?: number;
  offset?: number;
};

export const useUsers = (params: ListUsersParams = {}) => {
  return useApiQuery<UsersListResponse, User[]>({
    queryKey: ['v1/users', null, params],
    select: (data) => data.items,
  });
};
