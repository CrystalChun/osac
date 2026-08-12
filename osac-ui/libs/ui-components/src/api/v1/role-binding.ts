import { type MessageInitShape } from '@bufbuild/protobuf';
import { useMutation } from '@tanstack/react-query';

import { type RoleBindingSchema, RoleBindings } from '@osac/types';

import { useApiFetch } from '../api-context';
import { type ListParams, apiQueryKey } from '../types';
import { type ApiQueryClient, useApiQuery, useApiQueryClient } from '../use-api-query';
import { buildUpdateMaskPaths } from './update-mask';

const invalidateRoleBindingQueries = (qc: ApiQueryClient) =>
  qc.invalidateQueries({ queryKey: apiQueryKey('v1/role_bindings') });

export const useRoleBindings = (params: ListParams = {}) => {
  const client = useApiFetch(RoleBindings);
  return useApiQuery({
    queryKey: apiQueryKey('v1/role_bindings', undefined, params),
    queryFn: () => client.list(params),
    select: (data) => data.items,
  });
};

export const useRoleBinding = (id?: string) => {
  const client = useApiFetch(RoleBindings);
  return useApiQuery({
    queryKey: apiQueryKey('v1/role_bindings', [id]),
    queryFn: () => client.get({ id }),
    select: (data) => data.object,
    enabled: !!id,
  });
};

export const useCreateRoleBinding = () => {
  const client = useApiFetch(RoleBindings);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: async (body: MessageInitShape<typeof RoleBindingSchema>) => {
      const resp = await client.create({ object: body });
      if (!resp.object) {
        throw new Error('Create response missing role binding object');
      }
      return resp.object;
    },
    onSuccess: () => invalidateRoleBindingQueries(qc),
  });
};

export const useUpdateRoleBinding = () => {
  const client = useApiFetch(RoleBindings);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: MessageInitShape<typeof RoleBindingSchema>;
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
        throw new Error('Update response missing role binding object');
      }
      return resp.object;
    },
    onSuccess: () => invalidateRoleBindingQueries(qc),
  });
};

export const useDeleteRoleBinding = () => {
  const client = useApiFetch(RoleBindings);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.delete({ id }),
    onSuccess: () => invalidateRoleBindingQueries(qc),
  });
};
