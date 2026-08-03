import { type MessageInitShape } from '@bufbuild/protobuf';
import { useMutation } from '@tanstack/react-query';

import { type TenantSchema, Tenants } from '@osac/types/private';

import { useApiFetch } from '../../api-context';
import { type ListParams, apiQueryKey } from '../../types';
import { type ApiQueryClient, useApiQuery, useApiQueryClient } from '../../use-api-query';

const invalidateTenantsQueries = (qc: ApiQueryClient) =>
  qc.invalidateQueries({ queryKey: apiQueryKey('v1/private/tenants') });

export const useTenants = (params: ListParams = {}) => {
  const client = useApiFetch(Tenants);
  return useApiQuery({
    queryKey: apiQueryKey('v1/private/tenants', undefined, params),
    queryFn: () => client.list(params),
    select: (data) => data.items,
  });
};

export const useDeleteTenant = () => {
  const client = useApiFetch(Tenants);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.delete({ id }),
    onSuccess: () => invalidateTenantsQueries(qc),
  });
};

export const useCreateTenant = () => {
  const client = useApiFetch(Tenants);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: async (body: MessageInitShape<typeof TenantSchema>) => {
      const resp = await client.create({ object: body });
      if (!resp.object) {
        throw new Error('Create response missing tenant object');
      }
      return resp.object;
    },
    onSuccess: () => invalidateTenantsQueries(qc),
  });
};
