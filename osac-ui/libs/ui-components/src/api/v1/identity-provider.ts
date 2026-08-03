import { type MessageInitShape } from '@bufbuild/protobuf';
import { useMutation } from '@tanstack/react-query';

import { type IdentityProviderSchema, IdentityProviders } from '@osac/types';

import { useApiFetch } from '../api-context';
import { type ListParams, apiQueryKey } from '../types';
import { type ApiQueryClient, useApiQuery, useApiQueryClient } from '../use-api-query';
import { buildUpdateMaskPaths } from './update-mask';

const invalidateIdentityProviderQueries = (qc: ApiQueryClient) =>
  qc.invalidateQueries({ queryKey: apiQueryKey('v1/identity_providers') });

export const useIdentityProviders = (params: ListParams = {}) => {
  const client = useApiFetch(IdentityProviders);
  return useApiQuery({
    queryKey: apiQueryKey('v1/identity_providers', undefined, params),
    queryFn: () => client.list(params),
    select: (data) => data.items,
  });
};

export const useIdentityProvider = (id?: string) => {
  const client = useApiFetch(IdentityProviders);
  return useApiQuery({
    queryKey: apiQueryKey('v1/identity_providers', [id]),
    queryFn: () => client.get({ id }),
    select: (data) => data.object,
    enabled: !!id,
  });
};

export const useCreateIdentityProvider = () => {
  const client = useApiFetch(IdentityProviders);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: async (body: MessageInitShape<typeof IdentityProviderSchema>) => {
      const resp = await client.create({ object: body });
      if (!resp.object) {
        throw new Error('Create response missing identity provider object');
      }
      return resp.object;
    },
    onSuccess: () => invalidateIdentityProviderQueries(qc),
  });
};

export const useUpdateIdentityProvider = () => {
  const client = useApiFetch(IdentityProviders);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: MessageInitShape<typeof IdentityProviderSchema>;
    }) => {
      const resp = await client.update({
        object: {
          id,
          ...body,
        },
        updateMask: {
          paths: buildUpdateMaskPaths(body),
        },
      });
      if (!resp.object) {
        throw new Error('Update response missing identity provider object');
      }
      return resp.object;
    },
    onSuccess: () => invalidateIdentityProviderQueries(qc),
  });
};

export const useDeleteIdentityProvider = () => {
  const client = useApiFetch(IdentityProviders);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.delete({ id }),
    onSuccess: () => invalidateIdentityProviderQueries(qc),
  });
};
