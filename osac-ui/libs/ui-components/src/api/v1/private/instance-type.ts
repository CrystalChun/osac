import { type MessageInitShape } from '@bufbuild/protobuf';
import { useMutation } from '@tanstack/react-query';

import { InstanceTypeSchema, InstanceTypes } from '@osac/types/private';

import { useApiFetch } from '../../api-context';
import { type ListParams, apiQueryKey } from '../../types';
import { type ApiQueryClient, useApiQuery, useApiQueryClient } from '../../use-api-query';
import { buildUpdateMaskPaths } from '../update-mask';

export const useAdminInstanceTypes = (params: ListParams = {}) => {
  const client = useApiFetch(InstanceTypes);
  return useApiQuery({
    queryKey: apiQueryKey('v1/private/instance_types', undefined, params),
    queryFn: () => client.list(params),
    select: (data) => data.items,
  });
};

export const invalidateInstanceTypesQueries = (qc: ApiQueryClient) =>
  qc.invalidateQueries({ queryKey: apiQueryKey('v1/private/instance_types') });

export type UpdateInstanceTypeInput = {
  id: string;
  body: MessageInitShape<typeof InstanceTypeSchema>;
};

export const useUpdateInstanceType = () => {
  const client = useApiFetch(InstanceTypes);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: UpdateInstanceTypeInput) => {
      const resp = await client.update({
        object: { id, ...body },
        updateMask: { paths: buildUpdateMaskPaths(body as Record<string, unknown>) },
      });
      if (!resp.object) {
        throw new Error('Update response missing object');
      }
      return resp.object;
    },
    onSuccess: () => invalidateInstanceTypesQueries(qc),
  });
};

export const useDeleteInstanceType = () => {
  const client = useApiFetch(InstanceTypes);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.delete({ id }),
    onSuccess: () => invalidateInstanceTypesQueries(qc),
  });
};
