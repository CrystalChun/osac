import { type MessageInitShape } from '@bufbuild/protobuf';
import { useMutation } from '@tanstack/react-query';

import { type ProjectMembershipSchema, ProjectMemberships } from '@osac/types';

import { useApiFetch } from '../api-context';
import { type ListParams, apiQueryKey } from '../types';
import { type ApiQueryClient, useApiQuery, useApiQueryClient } from '../use-api-query';

const invalidateProjectMembershipQueries = (qc: ApiQueryClient) =>
  qc.invalidateQueries({ queryKey: apiQueryKey('v1/project_memberships') });

export const useProjectMemberships = (params: ListParams = {}) => {
  const client = useApiFetch(ProjectMemberships);
  return useApiQuery({
    queryKey: apiQueryKey('v1/project_memberships', undefined, params),
    queryFn: () => client.list(params),
    select: (data) => data.items,
  });
};

export const useCreateProjectMembership = () => {
  const client = useApiFetch(ProjectMemberships);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: async (body: MessageInitShape<typeof ProjectMembershipSchema>) => {
      const resp = await client.create({ object: body });
      if (!resp.object) {
        throw new Error('Create response missing project membership object');
      }
      return resp.object;
    },
    onSuccess: () => invalidateProjectMembershipQueries(qc),
  });
};

export const useDeleteProjectMembership = () => {
  const client = useApiFetch(ProjectMemberships);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.delete({ id }),
    onSuccess: () => invalidateProjectMembershipQueries(qc),
  });
};
