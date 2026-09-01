import { useMutation } from '@tanstack/react-query';

import { BareMetalInstanceTypes } from '@osac/types/private';

import { useApiFetch } from '../../api-context';
import { type ListParams, apiQueryKey } from '../../types';
import { type ApiQueryClient, useApiQuery, useApiQueryClient } from '../../use-api-query';

export const useAdminBareMetalInstanceTypes = (params: ListParams = {}) => {
  const client = useApiFetch(BareMetalInstanceTypes);
  return useApiQuery({
    queryKey: apiQueryKey('v1/private/baremetal_instance_types', undefined, params),
    queryFn: () => client.list(params),
    select: (data) => data.items,
  });
};

export const invalidateBareMetalInstanceTypesQueries = (qc: ApiQueryClient) =>
  qc.invalidateQueries({ queryKey: apiQueryKey('v1/private/baremetal_instance_types') });

export const useDeleteBareMetalInstanceType = () => {
  const client = useApiFetch(BareMetalInstanceTypes);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.delete({ id }),
    onSuccess: () => invalidateBareMetalInstanceTypesQueries(qc),
  });
};
